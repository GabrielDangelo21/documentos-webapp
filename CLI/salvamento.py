from datetime import datetime
import json
from typing import List
import configuracao as configuracao


def salvar_documento(documentos: List[dict], caminho: str) -> None:
    documentos_json = []
    for documento in documentos:
        nome = documento["nome"]
        validade_str = str(documento["validade"])
        alerta = documento["alerta"]
        categoria = documento["categoria"]
        doc_json = {
            "nome": nome,
            "validade": validade_str,
            "alerta": alerta,
            "categoria": categoria,
        }
        documentos_json.append(doc_json)
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(documentos_json, f, indent=2)


def carregar_documentos(caminho: str) -> List[dict]:
    documentos: List[dict] = []
    try:
        with open(caminho, "r", encoding="utf-8") as f:
            documento = json.load(f)

        if not isinstance(documento, list):
            return []

        for dados in documento:

            if not isinstance(dados, dict):
                continue

            nome = dados.get("nome", "")
            data_validade = dados.get("validade", "")
            alerta = dados.get("alerta", 0)
            try:
                validade = datetime.strptime(str(data_validade), "%Y-%m-%d").date()
            except (ValueError, TypeError):
                continue
            categoria_raw = dados.get("categoria", configuracao.categoria_padrao)
            categoria = str(categoria_raw).strip()
            if not categoria:
                categoria = configuracao.categoria_padrao
            if categoria not in configuracao.categorias:
                categoria = configuracao.categoria_padrao

            doc = {
                "nome": nome,
                "validade": validade,
                "alerta": alerta,
                "categoria": categoria,
            }
            documentos.append(doc)
        return documentos
    except FileNotFoundError:
        return []
    except json.JSONDecodeError:
        return []
