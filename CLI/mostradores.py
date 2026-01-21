from operator import itemgetter
from typing import List
import configuracao as configuracao
from servicos import calcular_status


def mostrar_menu() -> None:
    print("\n=== GERENCIADOR DE DOCUMENTOS ===")
    print("1. Cadastrar documentos")
    print("2. Listar documentos")
    print("3. Listar documentos por categoria")
    print("4. Listar alertas")
    print("5. Buscar documento")
    print("6. Editar documento")
    print("7. Remover documento")
    print("0. Sair")


def mostrar_menu_edicao() -> None:
    print("\n=== EDIÇÃO DE DOCUMENTOS ===")
    print("1. Editar nome")
    print("2. Editar validade")
    print("3. Editar alerta")
    print("4. Editar categoria")
    print("0. Cancelar")


def mostrar_menu_categoria() -> None:
    print("\n=== CATEGORIAS ===")
    for indice, opcao in enumerate(configuracao.categorias):
        print(f"{indice + 1}. {opcao}")


def listar_documentos(documentos: list[dict]) -> None:
    if not documentos:
        print("Nenhum documento cadastrado.")
        return
    documentos_ordenados = sorted(
        documentos, key=itemgetter("validade", "nome", "categoria")
    )
    for documento in documentos_ordenados:
        nome = documento["nome"]
        validade = documento["validade"]
        categoria = documento["categoria"]
        dias, status = calcular_status(documento)
        if dias < 0:
            print(
                f"{nome} | {categoria} | validade {validade} | vencido há {-(dias)} dia(s) | {status}"
            )
        else:
            print(
                f"{nome} | {categoria} | validade {validade} | vence em {dias} dia(s) | {status}"
            )


def listar_documentos_com_indice(documentos: List[dict]) -> List[dict]:
    documentos_ordenados = sorted(
        documentos, key=itemgetter("validade", "nome", "categoria")
    )
    for indice, documento in enumerate(documentos_ordenados, start=1):
        nome = documento["nome"]
        validade = documento["validade"]
        categoria = documento["categoria"]
        dias, status = calcular_status(documento)
        if dias < 0:
            print(
                f"{indice}) {nome} | {categoria} | validade {validade} | vencido há {-(dias)} dia(s) | {status}"
            )
        else:
            print(
                f"{indice}) {nome} | {categoria} | validade {validade} | vence em {dias} dia(s) | {status}"
            )
    return documentos_ordenados


def listar_alertas(documentos: list[dict]) -> None:
    if not documentos:
        print("Nenhum alerta cadastrado.")
        return
    alerta_encontrado = False
    for documento in documentos:
        nome = documento["nome"]
        categoria = documento["categoria"]
        dias, status = calcular_status(documento)
        if status.lower() == "ok":
            continue

        alerta_encontrado = True
        if dias < 0:
            print(f"{nome} | {categoria} | vencido há {-(dias)} dia(s)| {status}")
        else:
            print(f"{nome} | {categoria} | vence em {dias} dia(s) | {status}")
    if not alerta_encontrado:
        print("Nenhum documento em alerta.")
