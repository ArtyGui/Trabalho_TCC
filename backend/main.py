from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
import enum
import jwt
import bcrypt

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurações JWT
SECRET_KEY = "sua-chave-secreta-super-segura"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

# ===== ENUMS =====

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OPERADOR = "operador"
    VISUALIZADOR = "visualizador"

class TipoContainer(str, enum.Enum):
    GP20 = "20GP"
    GP40 = "40GP"
    HC40 = "40HC"

class StatusContainer(str, enum.Enum):
    AGUARDANDO = "aguardando"
    ALOCADO = "alocado"

class TipoEquipamento(str, enum.Enum):
    REACH_STACKER = "reach_stacker"
    RTG = "rtg"
    TOP_LOADER = "top_loader"

# ===== MODELOS =====

class UserInDB(BaseModel):
    email: EmailStr
    name: str
    password_hash: str
    role: UserRole

class Container(BaseModel):
    id: str
    tipo: TipoContainer
    cliente: str
    peso: float
    data_entrada: datetime
    data_saida_prevista: Optional[datetime] = None
    status: StatusContainer = StatusContainer.AGUARDANDO
    patio_id: Optional[int] = None  # NOVO: qual pátio
    bloco: Optional[str] = None
    rua: Optional[str] = None
    lote: Optional[str] = None
    posicao: Optional[str] = None
    nivel: Optional[int] = None
    endereco: Optional[str] = None

class PatioConfigModel(BaseModel):
    id: Optional[int] = None  # NOVO: ID do pátio
    nome: str
    largura: float
    comprimento: float
    areaTotal: float
    numeroBlocos: int
    ruasPorBloco: int
    lotesPorRua: int
    posicoesPorLote: int
    totalPosicoes: int
    equipamento: TipoEquipamento
    niveis_maximos: int  # NOVO: configurável manualmente
    imagemPlanta: Optional[str] = None
    observacoes: Optional[str] = None
    ativo: bool = True  # NOVO: pátio ativo ou não

class Posicao(BaseModel):
    id: str
    nome: str
    loteId: str
    blocoNome: str
    ruaNome: str
    loteNome: str
    nivel: int
    patio_id: int  # NOVO: pertence a qual pátio
    ocupada: bool = False
    containerId: Optional[str] = None

# ===== DATABASE =====

class Database:
    def __init__(self):
        self.users: List[UserInDB] = []
        self.containers: List[Container] = []
        self.patios: List[PatioConfigModel] = []  # NOVO: lista de pátios
        self.posicoes: List[Posicao] = []
        self.patio_counter = 0  # NOVO: contador de IDs
        
        self._criar_usuarios_padrao()
    
    def _criar_usuarios_padrao(self):
        usuarios = [
            {"email": "admin@logibox.com", "name": "Administrador", "password": "admin123", "role": UserRole.ADMIN},
            {"email": "operador@logibox.com", "name": "Operador", "password": "operador123", "role": UserRole.OPERADOR},
            {"email": "visualizador@logibox.com", "name": "Visualizador", "password": "visualizador123", "role": UserRole.VISUALIZADOR},
        ]
        
        for user_data in usuarios:
            password_hash = bcrypt.hashpw(user_data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user = UserInDB(
                email=user_data["email"],
                name=user_data["name"],
                password_hash=password_hash,
                role=user_data["role"]
            )
            self.users.append(user)

db = Database()

# ===== AUTENTICAÇÃO =====

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.get("/")
def root():
    return {"message": "LogiBox API v3.0 - Sistema Multi-Pátio com Empilhamento 3D"}

@app.post("/auth/login")
def login(credentials: dict):
    email = credentials.get("email")
    password = credentials.get("password")
    
    user = next((u for u in db.users if u.email == email), None)
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    token = create_access_token({"sub": user.email, "role": user.role.value})
    
    return {
        "token": token,
        "user": {
            "email": user.email,
            "name": user.name,
            "role": user.role.value
        }
    }

# ===== PÁTIOS (MÚLTIPLOS) =====

@app.post("/patios")
def criar_patio(config: PatioConfigModel):
    """Cria um novo pátio"""
    db.patio_counter += 1
    config.id = db.patio_counter
    
    db.patios.append(config)
    
    # Gera posições para este pátio
    blocos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    
    for b in range(config.numeroBlocos):
        for r in range(config.ruasPorBloco):
            for l in range(config.lotesPorRua):
                for p in range(config.posicoesPorLote):
                    for nivel in range(1, config.niveis_maximos + 1):
                        posicao = Posicao(
                            id=f"P{config.id}-{blocos[b]}-R{r+1}-L{l+1}-P{p+1}-N{nivel}",
                            nome=f"Pos {p+1}",
                            loteId=f"P{config.id}-{blocos[b]}-R{r+1}-L{l+1}",
                            blocoNome=blocos[b],
                            ruaNome=f"Rua {r+1}",
                            loteNome=f"Lote {l+1}",
                            nivel=nivel,
                            patio_id=config.id,
                            ocupada=False
                        )
                        db.posicoes.append(posicao)
    
    total_posicoes = len([p for p in db.posicoes if p.patio_id == config.id])
    
    return {
        "message": "Pátio criado com sucesso",
        "patio": config,
        "total_posicoes": total_posicoes
    }

@app.get("/patios")
def listar_patios(ativo: Optional[bool] = None):
    """Lista todos os pátios"""
    patios_filtrados = db.patios
    
    if ativo is not None:
        patios_filtrados = [p for p in db.patios if p.ativo == ativo]
    
    return {"patios": patios_filtrados}

@app.get("/patios/{patio_id}")
def obter_patio(patio_id: int):
    """Obtém detalhes de um pátio específico"""
    patio = next((p for p in db.patios if p.id == patio_id), None)
    
    if not patio:
        raise HTTPException(status_code=404, detail="Pátio não encontrado")
    
    posicoes_patio = [p for p in db.posicoes if p.patio_id == patio_id]
    total_posicoes = len(posicoes_patio)
    ocupadas = len([p for p in posicoes_patio if p.ocupada])
    livres = total_posicoes - ocupadas
    percentual = (ocupadas / total_posicoes * 100) if total_posicoes > 0 else 0
    
    return {
        "config": patio,
        "estatisticas": {
            "totalPosicoes": total_posicoes,
            "posicoesOcupadas": ocupadas,
            "posicoesLivres": livres,
            "percentualOcupacao": round(percentual, 2)
        },
        "posicoes": posicoes_patio
    }

@app.put("/patios/{patio_id}")
def atualizar_patio(patio_id: int, config: PatioConfigModel):
    """Atualiza configuração de um pátio"""
    patio = next((p for p in db.patios if p.id == patio_id), None)
    
    if not patio:
        raise HTTPException(status_code=404, detail="Pátio não encontrado")
    
    # Atualiza configuração
    config.id = patio_id
    idx = db.patios.index(patio)
    db.patios[idx] = config
    
    return {"message": "Pátio atualizado com sucesso", "patio": config}

@app.delete("/patios/{patio_id}")
def desativar_patio(patio_id: int):
    """Desativa um pátio (não remove, apenas marca como inativo)"""
    patio = next((p for p in db.patios if p.id == patio_id), None)
    
    if not patio:
        raise HTTPException(status_code=404, detail="Pátio não encontrado")
    
    patio.ativo = False
    
    return {"message": "Pátio desativado com sucesso"}

@app.delete("/patios/{patio_id}/limpar")
def limpar_patio(patio_id: int):
    """Limpa todas as alocações de um pátio"""
    posicoes_patio = [p for p in db.posicoes if p.patio_id == patio_id]
    
    for posicao in posicoes_patio:
        posicao.ocupada = False
        posicao.containerId = None
    
    containers_patio = [c for c in db.containers if c.patio_id == patio_id]
    for container in containers_patio:
        container.status = StatusContainer.AGUARDANDO
        container.endereco = None
        container.nivel = None
    
    return {"message": f"Pátio {patio_id} limpo com sucesso"}

# ===== CONTÊINERES =====

@app.post("/containers")
def adicionar_container(container: Container):
    if any(c.id == container.id for c in db.containers):
        raise HTTPException(status_code=400, detail="Container já existe")
    
    # Define data de entrada como hoje se não fornecida
    if not container.data_entrada:
        container.data_entrada = datetime.now()
    
    container.status = StatusContainer.AGUARDANDO
    db.containers.append(container)
    return container

@app.get("/containers")
def listar_containers(status: Optional[str] = None, patio_id: Optional[int] = None):
    containers_filtrados = db.containers
    
    if status:
        containers_filtrados = [c for c in containers_filtrados if c.status.value == status]
    
    if patio_id:
        containers_filtrados = [c for c in containers_filtrados if c.patio_id == patio_id]
    
    return {"containers": containers_filtrados}

@app.delete("/containers/{container_id}")
def remover_container(container_id: str):
    container = next((c for c in db.containers if c.id == container_id), None)
    if not container:
        raise HTTPException(status_code=404, detail="Container não encontrado")
    
    if container.status == StatusContainer.ALOCADO:
        for posicao in db.posicoes:
            if posicao.containerId == container_id:
                posicao.ocupada = False
                posicao.containerId = None
    
    db.containers.remove(container)
    return {"message": "Container removido com sucesso"}

# ===== ALOCAÇÃO =====

def verificar_regras_empilhamento(container: Container, posicao_base: Posicao) -> tuple[bool, str]:
    """
    Verifica regras de empilhamento:
    - 20GP só empilha sobre 20GP
    - 40GP/40HC só empilha sobre 40GP/40HC
    - Mais pesado na base
    - Saída próxima no topo
    """
    if posicao_base.nivel == 1:
        return True, ""
    
    posicao_abaixo_id = posicao_base.id.replace(f"-N{posicao_base.nivel}", f"-N{posicao_base.nivel - 1}")
    posicao_abaixo = next((p for p in db.posicoes if p.id == posicao_abaixo_id), None)
    
    if not posicao_abaixo or not posicao_abaixo.ocupada:
        return False, "Não há container abaixo"
    
    container_abaixo = next((c for c in db.containers if c.id == posicao_abaixo.containerId), None)
    if not container_abaixo:
        return False, "Container abaixo não encontrado"
    
    # NOVA REGRA: 20GP só empilha em 20GP, 40GP/40HC só empilha em 40GP/40HC
    if container.tipo == TipoContainer.GP20:
        if container_abaixo.tipo != TipoContainer.GP20:
            return False, "Container 20GP só pode empilhar sobre outro 20GP"
    else:  # 40GP ou 40HC
        if container_abaixo.tipo == TipoContainer.GP20:
            return False, "Container 40GP/40HC só pode empilhar sobre outro 40GP/40HC"
    
    if container.peso > container_abaixo.peso:
        return False, "Container muito pesado para empilhar"
    
    if container.data_saida_prevista and container_abaixo.data_saida_prevista:
        if container.data_saida_prevista > container_abaixo.data_saida_prevista:
            return False, "Saída tardia não pode ficar sobre saída próxima"
    
    return True, ""

@app.post("/patios/{patio_id}/alocar")
def alocar_containers(patio_id: int, container_ids: List[str]):
    """Aloca containers em um pátio específico - TODOS ocupam 1 posição"""
    patio = next((p for p in db.patios if p.id == patio_id), None)
    if not patio:
        raise HTTPException(status_code=404, detail="Pátio não encontrado")
    
    resultados = []
    
    for container_id in container_ids:
        container = next((c for c in db.containers if c.id == container_id), None)
        if not container:
            continue
        
        if container.status == StatusContainer.ALOCADO:
            resultados.append({
                "container_id": container.id,
                "sucesso": True,
                "mensagem": "Já estava alocado"
            })
            continue
        
        # MUDANÇA: Todos os containers ocupam apenas 1 posição
        vagas_necessarias = 1
        
        alocado = False
        posicoes_patio = [p for p in db.posicoes if p.patio_id == patio_id]
        
        bases = {}
        for pos in posicoes_patio:
            base_id = pos.id.rsplit('-N', 1)[0]
            if base_id not in bases:
                bases[base_id] = []
            bases[base_id].append(pos)
        
        for base_id, niveis in sorted(bases.items()):
            if alocado:
                break
            
            niveis_ordenados = sorted(niveis, key=lambda p: p.nivel)
            
            for nivel in niveis_ordenados:
                posicoes_nivel = [p for p in posicoes_patio 
                                 if p.blocoNome == nivel.blocoNome 
                                 and p.ruaNome == nivel.ruaNome 
                                 and p.loteNome == nivel.loteNome
                                 and p.nivel == nivel.nivel
                                 and not p.ocupada]
                
                if len(posicoes_nivel) >= vagas_necessarias:
                    posicoes_alocadas = sorted(posicoes_nivel, 
                                              key=lambda p: int(p.nome.replace('Pos ', '')))[:vagas_necessarias]
                    
                    pode_alocar = True
                    mensagem_erro = ""
                    
                    for pos in posicoes_alocadas:
                        pode, msg = verificar_regras_empilhamento(container, pos)
                        if not pode:
                            pode_alocar = False
                            mensagem_erro = msg
                            break
                    
                    if pode_alocar:
                        for posicao in posicoes_alocadas:
                            posicao.ocupada = True
                            posicao.containerId = container.id
                        
                        primeira_posicao = posicoes_alocadas[0]
                        container.status = StatusContainer.ALOCADO
                        container.patio_id = patio_id
                        container.bloco = primeira_posicao.blocoNome
                        container.rua = primeira_posicao.ruaNome
                        container.lote = primeira_posicao.loteNome
                        container.posicao = primeira_posicao.nome
                        container.nivel = primeira_posicao.nivel
                        
                        # MUDANÇA: Sempre 1 posição
                        container.endereco = f"{primeira_posicao.blocoNome} - {primeira_posicao.ruaNome} - {primeira_posicao.loteNome} - {primeira_posicao.nome} - Nível {primeira_posicao.nivel}"
                        
                        resultados.append({
                            "container_id": container.id,
                            "endereco": container.endereco,
                            "nivel": container.nivel,
                            "sucesso": True
                        })
                        
                        alocado = True
                        break
        
        if not alocado:
            resultados.append({
                "container_id": container.id,
                "sucesso": False,
                "mensagem": mensagem_erro or "Sem espaço disponível"
            })
    
    return {
        "message": "Alocação concluída",
        "resultados": resultados
    }

@app.post("/patios/{patio_id}/alocar/todos")
def alocar_todos_patio(patio_id: int):
    """Aloca todos os containers aguardando em um pátio específico"""
    containers_aguardando = [c for c in db.containers if c.status == StatusContainer.AGUARDANDO]
    
    if not containers_aguardando:
        return {"message": "Nenhum container aguardando"}
    
    containers_ordenados = sorted(containers_aguardando, key=lambda c: c.peso, reverse=True)
    
    return alocar_containers(patio_id, [c.id for c in containers_ordenados])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
