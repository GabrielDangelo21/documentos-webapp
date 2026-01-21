from salvamento import carregar_documentos
from leitores import ler_int
from mostradores import mostrar_menu
from menu_main import (
    cadastra_documento,
    lista_documento,
    lista_documento_por_categoria,
    lista_alertas,
    busca_documento,
    edita_documento,
    remove_documento,
    sai,
)


def main() -> None:

    caminho = "documentos.json"
    documentos = carregar_documentos(caminho)

    while True:

        mostrar_menu()
        opcao = ler_int("Escolha uma opção: ")

        if opcao == 0:
            sai(documentos, caminho)
            break

        elif opcao == 1:
            cadastra_documento(documentos, caminho)

        elif opcao == 2:
            lista_documento(documentos)

        elif opcao == 3:
            lista_documento_por_categoria(documentos)

        elif opcao == 4:
            lista_alertas(documentos)

        elif opcao == 5:
            busca_documento(documentos)

        elif opcao == 6:
            edita_documento(documentos, caminho)

        elif opcao == 7:
            remove_documento(documentos, caminho)

        else:
            print("=================================")
            print("Opção inválida. Tente novamente.")
            print("=================================")


if __name__ == "__main__":
    main()
