from datetime import date
from typing import List
import configuracao as configuracao


def cadastrar_documento(
    documentos: List[dict],
    nome: str,
    data_validade: date,
    alerta_dias: int,
    categoria: str,
) -> None:
    if nome.strip() == "":
        raise ValueError("Digite o nome do documento.")
    if alerta_dias < 0:
        raise ValueError("Dias para alerta não pode ser negativo.")
    if not categoria or categoria.strip() == "":
        categoria = configuracao.categoria_padrao
    if categoria not in configuracao.categorias:
        raise ValueError("Categoria inválida.")
    documento = {
        "nome": nome,
        "validade": data_validade,
        "alerta": alerta_dias,
        "categoria": categoria,
    }
    documentos.append(documento)


def calcular_status(documento: dict) -> tuple[int, str]:

    validade = documento["validade"]
    alerta = documento["alerta"]
    dias_para_vencimento = validade - date.today()
    if dias_para_vencimento.days < 0:
        status = "Vencido"
    elif dias_para_vencimento.days <= alerta:
        status = "Alerta"
    else:
        status = "Ok"
    return dias_para_vencimento.days, status


def buscar_documentos(documentos: List[dict], termo) -> List[dict]:
    if not termo:
        raise ValueError("Nenhum dado digitado.")
    resultados = []
    for documento in documentos:
        nome = documento["nome"]
        if termo.lower() in nome.lower():
            resultados.append(documento)
    return resultados


def listar_por_categoria(documentos: List[dict], categoria: str) -> List[dict]:
    if not categoria:
        categoria = configuracao.categoria_padrao
    resultados = []
    for documento in documentos:
        categoria_escolhida = documento.get("categoria", configuracao.categoria_padrao)
        if categoria == categoria_escolhida:
            resultados.append(documento)
    return resultados
