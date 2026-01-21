from mostradores import (
    listar_alertas,
    listar_documentos,
    listar_documentos_com_indice,
    mostrar_menu_edicao,
)
from salvamento import salvar_documento
from servicos import (
    buscar_documentos,
    cadastrar_documento,
    calcular_status,
    listar_por_categoria,
)
from leitores import ler_str, ler_categoria, ler_data, ler_int


def cadastra_documento(documentos, caminho):
    nome = ler_str("Documento: ")
    validade = ler_data("Data de validade: YYYY-MM-DD: ")
    alerta = ler_int("Dias para alertar: ")
    categoria = ler_categoria()
    try:
        cadastrar_documento(documentos, nome, validade, alerta, categoria)
        salvar_documento(documentos, caminho)
        print("Documento salvo com sucesso.")
    except ValueError as e:
        print(f"Erro: {e}")


def lista_documento(documentos):
    print("=================================")
    listar_documentos(documentos)
    print("=================================")


def lista_documento_por_categoria(documentos):
    categoria = ler_categoria()
    filtrados = listar_por_categoria(documentos, categoria)
    if not filtrados:
        print("=================================")
        print(f"Nenhum documento encontrado na categoria {categoria}")
        print("=================================")
    else:
        print("=================================")
        listar_documentos(filtrados)
        print("=================================")


def lista_alertas(documentos):
    print("=================================")
    listar_alertas(documentos)
    print("=================================")


def busca_documento(documentos):
    try:
        termo = ler_str("Digite o nome do documento: ")
        documentos_encontrados = buscar_documentos(documentos, termo)
        if not documentos_encontrados:
            print("=================================")
            print("Nenhum documento encontrado")
            print("=================================")

        else:
            print("=================================")
            listar_documentos(documentos_encontrados)
            print("=================================")

    except ValueError as e:
        print(f"Erro: {e}")


def edita_documento(documentos, caminho):
    termo = ler_str("Qual documento deseja editar? ")
    resultados = buscar_documentos(documentos, termo)
    if not resultados:
        print("=================================")
        print("Nenhum documento encontrado.")
        print("=================================")
        return

    print("=================================")
    resultados_ordenados = listar_documentos_com_indice(resultados)
    print("=================================")

    while True:
        indice = ler_int("Digite o número do documento que deseja editar: ")
        if indice < 1 or indice > len(resultados_ordenados):
            print("=================================")
            print("Número de documento inválido.")
            print("=================================")
            continue
        break

    doc_escolhido = resultados_ordenados[indice - 1]

    while True:
        mostrar_menu_edicao()
        opcao_edicao = ler_int("Escolha uma opção: ")

        if opcao_edicao == 0:
            print("=================================")
            print("Cancelando...")
            print("=================================")
            break

        if opcao_edicao not in (1, 2, 3, 4):
            print("=================================")
            print("Opção inválida. Tente novamente.")
            print("=================================")
            continue

        nome_antes = doc_escolhido["nome"]
        validade_antes = doc_escolhido["validade"]
        alerta_antes = doc_escolhido["alerta"]
        categoria_antes = doc_escolhido["categoria"]
        dias_antes, status_antes = calcular_status(doc_escolhido)

        if opcao_edicao == 1:
            doc_escolhido["nome"] = ler_str("Digite o novo nome: ")

        elif opcao_edicao == 2:
            doc_escolhido["validade"] = ler_data(
                "Digite a nova data de validade: YYYY-MM-DD "
            )

        elif opcao_edicao == 3:
            while True:
                novo_alerta = ler_int("Digite os dias para o novo alerta: ")
                if novo_alerta < 0:
                    print("=================================")
                    print("Valor inválido (não pode ser negativo) ")
                    print("=================================")
                    continue
                doc_escolhido["alerta"] = novo_alerta
                break
        elif opcao_edicao == 4:
            doc_escolhido["categoria"] = ler_categoria()

        nome_editado = doc_escolhido["nome"]
        categoria_editada = doc_escolhido["categoria"]
        dias_editado, status_editado = calcular_status(doc_escolhido)
        print("=================================")
        print("Alteração pronta. Confirme.")
        print("Antes")
        if dias_antes < 0:
            print(
                f"{nome_antes} | {categoria_antes} | validade {validade_antes} | vencido há {-(dias_antes)} dia(s) | {status_antes}"
            )
        else:
            print(
                f"{nome_antes} | {categoria_antes} | validade {validade_antes} | vence em {dias_antes} dia(s) | alerta para {alerta_antes} | {status_antes}"
            )
        print("Depois")
        if dias_editado < 0:
            print(
                f"{nome_editado} | {categoria_editada} | validade {doc_escolhido['validade']} | vencido há {-(dias_editado)} dia(s) | {status_editado}"
            )
        else:
            print(
                f"{nome_editado} | {categoria_editada} | validade {doc_escolhido['validade']} | vence em {dias_editado} dia(s) | alerta para {doc_escolhido['alerta']} | {status_editado}"
            )
        print("=================================")
        while True:
            opcao_confirmacao = (
                ler_str("Deseja salvar a alteração? (s/n)").strip().lower()
            )
            if opcao_confirmacao == "s":
                salvar_documento(documentos, caminho)
                print("=================================")
                print("Salvo com sucesso.")
                print("=================================")
                break
            elif opcao_confirmacao == "n":
                doc_escolhido["nome"] = nome_antes
                doc_escolhido["validade"] = validade_antes
                doc_escolhido["alerta"] = alerta_antes
                doc_escolhido["categoria"] = categoria_antes
                print("=================================")
                print("Alterações descartadas.")
                print("=================================")
                break
            else:
                print("Digite s ou n")


def remove_documento(documentos, caminho):
    termo = ler_str("Qual documento deseja remover? ")
    resultados = buscar_documentos(documentos, termo)
    if not resultados:
        print("=================================")
        print("Nenhum documento encontrado.")
        print("=================================")
        return
    else:
        print("=================================")
        resultados_ordenados = listar_documentos_com_indice(resultados)
        print("=================================")
        while True:
            indice = ler_int("Digite o número do documento que deseja remover: ")
            if indice < 1 or indice > len(resultados_ordenados):
                print("=================================")
                print("Número de documento inválido.")
                print("=================================")
                continue

            doc_escolhido = resultados_ordenados[indice - 1]

            while True:
                opcao_confirmacao = (
                    ler_str("Deseja mesmo remover o documento? (s/n)").strip().lower()
                )
                if opcao_confirmacao == "s":
                    documentos.remove(doc_escolhido)
                    salvar_documento(documentos, caminho)
                    print("=================================")
                    print("Documento removido com sucesso.")
                    print("=================================")
                    break
                elif opcao_confirmacao == "n":
                    print("=================================")
                    print("Remoção cancelada.")
                    print("=================================")
                    break
                else:
                    print("Digite s ou n")
            break


def sai(documentos, caminho):
    salvar_documento(documentos, caminho)
    print("Saindo...")
