from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
SECRET_KEY = "sua-chave-secreta-super-segura-mude-em-producao"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

security = HTTPBearer()

# ===== MODELOS DE AUTENTICAÇÃO =====

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OPERADOR = "operador"
    VISUALIZADOR = "visualizador"

class UserInDB(BaseModel):
    email: EmailStr
    name: str
    password_hash: str
    role: UserRole

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

# ===== MODELOS DO SISTEMA =====

class TipoContainer(str, enum.Enum):
    GP20 = "20GP"
    GP40 = "40GP"
    HC40 = "40HC"

class StatusContainer(str, enum.Enum):
    AGUARDANDO = "aguardando"
    ALOCADO = "alocado"

class Container(BaseModel):
    id: str
    tipo: TipoContainer
    cliente: str
    data_entrada: datetime
    status: StatusContainer = StatusContainer.AGUARDANDO
    endereco: Optional[str] = None
    bloco: Optional[str] = None
    rua: Optional[str] = None
    lote: Optional[str] = None
    posicao: Optional[str] = None

class PatioConfigModel(BaseModel):
    nome: str
    largura: float
    comprimento: float
    numeroBlocos: int
    ruasPorBloco: int
    lotesPorRua: int
    posicoesPorLote: int
    imagemPlanta: Optional[str] = None
    observacoes: Optional[str] = None

class Posicao(BaseModel):
    id: str
    nome: str
    loteId: str
    blocoNome: str
    ruaNome: str
    loteNome: str
    ocupada: bool = False
    containerId: Optional[str] = None

# ===== BANCO DE DADOS EM MEMÓRIA =====

class Database:
    def __init__(self):
        self.users: List[UserInDB] = []
        self.containers: List[Container] = []
        self.patio_config: Optional[PatioConfigModel] = None
        self.posicoes: List[Posicao] = []
        
        # Usuários padrão
        self._create_default_users()
    
    def _create_default_users(self):
        """Cria usuários padrão no sistema"""
        default_users = [
            {"email": "admin@logibox.com", "name": "Administrador", "password": "admin123", "role": UserRole.ADMIN},
            {"email": "operador@logibox.com", "name": "Operador", "password": "operador123", "role": UserRole.OPERADOR},
            {"email": "visualizador@logibox.com", "name": "Visualizador", "password": "visualizador123", "role": UserRole.VISUALIZADOR},
        ]
        
        for user_data in default_users:
            password_hash = bcrypt.hashpw(
                user_data["password"].encode('utf-8'), 
                bcrypt.gensalt()
            ).decode('utf-8')
            
            user = UserInDB(
                email=user_data["email"],
                name=user_data["name"],
                password_hash=password_hash,
                role=user_data["role"]
            )
            self.users.append(user)

db = Database()

# ===== FUNÇÕES DE AUTENTICAÇÃO =====

def create_access_token(data: dict):
    """Cria token JWT"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica token JWT"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

def get_current_user(email: str = Depends(verify_token)) -> UserInDB:
    """Obtém usuário atual do token"""
    user = next((u for u in db.users if u.email == email), None)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

# ===== FUNÇÕES AUXILIARES =====

def gerar_estrutura_patio(config: PatioConfigModel):
    posicoes = []
    blocos_letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    
    for bloco_idx in range(config.numeroBlocos):
        bloco_nome = blocos_letras[bloco_idx] if bloco_idx < len(blocos_letras) else f"Bloco {bloco_idx + 1}"
        
        for rua_idx in range(config.ruasPorBloco):
            rua_nome = f"Rua {rua_idx + 1}"
            
            for lote_idx in range(config.lotesPorRua):
                lote_nome = f"Lote {lote_idx + 1}"
                lote_id = f"{bloco_nome}-{rua_nome}-{lote_nome}"
                
                for pos_idx in range(config.posicoesPorLote):
                    pos_nome = f"Pos {pos_idx + 1}"
                    pos_id = f"{lote_id}-{pos_nome}"
                    
                    posicao = Posicao(
                        id=pos_id,
                        nome=pos_nome,
                        loteId=lote_id,
                        blocoNome=bloco_nome,
                        ruaNome=rua_nome,
                        loteNome=lote_nome,
                        ocupada=False
                    )
                    posicoes.append(posicao)
    
    return posicoes

# ===== ENDPOINTS DE AUTENTICAÇÃO =====

@app.post("/auth/login", response_model=LoginResponse)
def login(credentials: LoginRequest):
    """Login com validação real"""
    # Busca usuário
    user = next((u for u in db.users if u.email == credentials.email), None)
    
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Verifica senha
    if not bcrypt.checkpw(credentials.password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Cria token
    token = create_access_token({"sub": user.email, "role": user.role.value})
    
    return LoginResponse(
        token=token,
        user={
            "email": user.email,
            "name": user.name,
            "role": user.role.value
        }
    )

@app.post("/auth/register")
def register(user_data: RegisterRequest):
    """Registro de novo usuário"""
    # Verifica se email já existe
    
    if any(u.email == user_data.email for u in db.users):
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Valida senha
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter no mínimo 6 caracteres")
    
    # Hash da senha
    password_hash = bcrypt.hashpw(
        user_data.password.encode('utf-8'), 
        bcrypt.gensalt()
    ).decode('utf-8')
    
    # Cria usuário (novos usuários são visualizadores)
    new_user = UserInDB(
        email=user_data.email,
        name=user_data.name,
        password_hash=password_hash,
        role=UserRole.VISUALIZADOR
    )
    
    db.users.append(new_user)
    
    return {"message": "Usuário cadastrado com sucesso"}

@app.get("/auth/me")
def get_me(current_user: UserInDB = Depends(get_current_user)):
    """Retorna dados do usuário logado"""
    return {
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role.value
    }

# ===== ENDPOINTS DO SISTEMA =====

@app.get("/")
def read_root():
    return {
        "message": "LogiBox API v2.0 - Sistema Hierárquico com Autenticação",
        "version": "2.0.0",
        "status": "funcionando"
    }

@app.post("/patio/configurar")
def configurar_patio(config: PatioConfigModel, current_user: UserInDB = Depends(get_current_user)):
    # Apenas admin pode configurar

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas administradores podem configurar o pátio")
    
    if config.largura <= 0 or config.comprimento <= 0:
        raise HTTPException(status_code=400, detail="Dimensões inválidas")
    
    db.patio_config = config
    db.posicoes = gerar_estrutura_patio(config)
    
    for container in db.containers:
        container.status = StatusContainer.AGUARDANDO
        container.endereco = None
    
    total_posicoes = config.numeroBlocos * config.ruasPorBloco * config.lotesPorRua * config.posicoesPorLote
    
    return {
        "message": "Pátio configurado com sucesso",
        "total_posicoes": total_posicoes
    }

@app.get("/patio")
def obter_patio(current_user: UserInDB = Depends(get_current_user)):
    if not db.patio_config:
        raise HTTPException(status_code=404, detail="Pátio não configurado")
    
    total_posicoes = len(db.posicoes)
    posicoes_ocupadas = sum(1 for p in db.posicoes if p.ocupada)
    posicoes_livres = total_posicoes - posicoes_ocupadas
    percentual = (posicoes_ocupadas / total_posicoes * 100) if total_posicoes > 0 else 0
    
    return {
        "config": {
            "nome": db.patio_config.nome,
            "largura": db.patio_config.largura,
            "comprimento": db.patio_config.comprimento,
            "areaTotal": db.patio_config.largura * db.patio_config.comprimento,
            "numeroBlocos": db.patio_config.numeroBlocos,
            "ruasPorBloco": db.patio_config.ruasPorBloco,
            "lotesPorRua": db.patio_config.lotesPorRua,
            "posicoesPorLote": db.patio_config.posicoesPorLote,
            "totalPosicoes": total_posicoes,
            "imagemPlanta": db.patio_config.imagemPlanta,
            "observacoes": db.patio_config.observacoes
        },
        "estatisticas": {
            "totalPosicoes": total_posicoes,
            "posicoesOcupadas": posicoes_ocupadas,
            "posicoesLivres": posicoes_livres,
            "percentualOcupacao": round(percentual, 2)
        },
        "posicoes": [p.dict() for p in db.posicoes]
    }

@app.post("/containers")
def adicionar_container(container: Container, current_user: UserInDB = Depends(get_current_user)):
    # Operador ou admin podem adicionar as informações

    if current_user.role == UserRole.VISUALIZADOR:
        raise HTTPException(status_code=403, detail="Visualizadores não podem adicionar contêineres")
    
    if any(c.id == container.id for c in db.containers):
        raise HTTPException(status_code=400, detail="Container já existe")
    
    container.status = StatusContainer.AGUARDANDO
    db.containers.append(container)
    return container.dict()

@app.get("/containers")
def listar_containers(status: Optional[str] = None, current_user: UserInDB = Depends(get_current_user)):
    containers_filtrados = db.containers
    
    if status:
        containers_filtrados = [c for c in db.containers if c.status.value == status]
    
    return {"containers": [c.dict() for c in containers_filtrados]}

@app.delete("/containers/{container_id}")
def remover_container(container_id: str, current_user: UserInDB = Depends(get_current_user)):
    # Apenas admin poderá remover

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas administradores podem remover contêineres")
    
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

@app.post("/alocar")
def alocar_containers(container_ids: List[str], current_user: UserInDB = Depends(get_current_user)):
    """Aloca apenas os containers solicitados, mantendo os já alocados"""
    
    # Operador ou admin podem alocar
    if current_user.role == UserRole.VISUALIZADOR:
        raise HTTPException(status_code=403, detail="Visualizadores não podem alocar contêineres")
    
    if not db.patio_config:
        raise HTTPException(status_code=400, detail="Pátio não configurado")
    
    resultados = []
    
    for container_id in container_ids:
        container = next((c for c in db.containers if c.id == container_id), None)
        if not container:
            continue
        
        # Se tá alocado, pula
        if container.status == StatusContainer.ALOCADO:
            resultados.append({
                "container_id": container.id,
                "tipo": container.tipo.value,
                "endereco": container.endereco,
                "sucesso": True,
                "mensagem": "Já estava alocado"
            })
            continue
        
        vagas_necessarias = 1 if container.tipo == TipoContainer.GP20 else 2
        posicoes_disponiveis = [p for p in db.posicoes if not p.ocupada]
        
        if len(posicoes_disponiveis) >= vagas_necessarias:
            posicoes_alocadas = posicoes_disponiveis[:vagas_necessarias]
            
            for posicao in posicoes_alocadas:
                posicao.ocupada = True
                posicao.containerId = container.id
            
            primeira_posicao = posicoes_alocadas[0]
            container.status = StatusContainer.ALOCADO
            container.bloco = primeira_posicao.blocoNome
            container.rua = primeira_posicao.ruaNome
            container.lote = primeira_posicao.loteNome
            container.posicao = primeira_posicao.nome
            
            if vagas_necessarias == 1:
                container.endereco = f"{primeira_posicao.blocoNome} - {primeira_posicao.ruaNome} - {primeira_posicao.loteNome} - {primeira_posicao.nome}"
            else:
                ultima_posicao = posicoes_alocadas[-1]
                container.endereco = f"{primeira_posicao.blocoNome} - {primeira_posicao.ruaNome} - {primeira_posicao.loteNome} - {primeira_posicao.nome} à {ultima_posicao.nome}"
            
            resultados.append({
                "container_id": container.id,
                "tipo": container.tipo.value,
                "endereco": container.endereco,
                "sucesso": True
            })
        else:
            resultados.append({
                "container_id": container.id,
                "tipo": container.tipo.value,
                "sucesso": False,
                "mensagem": "Sem espaço disponível"
            })
    
    return {"message": "Alocação concluída", "resultados": resultados}

@app.post("/alocar/todos")
def alocar_todos_containers(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role == UserRole.VISUALIZADOR:
        raise HTTPException(status_code=403, detail="Visualizadores não podem alocar contêineres")
    
    containers_aguardando = [c for c in db.containers if c.status == StatusContainer.AGUARDANDO]
    if not containers_aguardando:
        return {"message": "Nenhum container aguardando"}
    
    return alocar_containers([c.id for c in containers_aguardando], current_user)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)