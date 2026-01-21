from datetime import datetime
import configuracao as configuracao
from mostradores import mostrar_menu_categoria


def ler_data(prompt: str) -> datetime.date:
    while True:
        try:
            data_prompt = input(prompt)
            data_format = "%Y-%m-%d"
            data = datetime.strptime(data_prompt, data_format)
            return data.date()
        except ValueError:
            print("Digite uma data válida no formato YYYY-MM-DD")


def ler_str(prompt: str) -> str:
    while True:
        valor = input(prompt)
        if valor.strip() != "":
            return valor
        print("Entrada vazia, digite algo.")


def ler_int(prompt: str) -> int:
    while True:
        try:
            valor = int(input(prompt))
            return valor
        except ValueError:
            print("Entrada inválida. Digite um número inteiro.")


def ler_categoria():
    while True:
        mostrar_menu_categoria()

        opcao_categoria_str = input("Escolha a categoria: (Enter = Outros) ")
        if not opcao_categoria_str.strip():
            categoria = configuracao.categoria_padrao
            return categoria

        try:
            opcao_categoria = int(opcao_categoria_str)

            if opcao_categoria < 1 or opcao_categoria > len(configuracao.categorias):
                print("=================================")
                print("Opção inválida. Tente novamente.")
                print("=================================")
                continue

            categoria = configuracao.categorias[opcao_categoria - 1]
            return categoria

        except ValueError:
            print("Entrada inválida. Digite um número.")
