from datetime import date, datetime
from typing import List
import json

"""
 TODO
Remover documento por nome
Editar validade/alerta
Ordenar por vencimento
Buscar por nome
Enviar alerta de alguma forma
"""


def ler_data(prompt: str) -> datetime.date:
    while True:
        try:
            data_prompt = input(prompt)
            data_format = '%Y-%m-%d'
            data = datetime.strptime(data_prompt, data_format)
            return data.date()
        except ValueError:
            print('Digite uma data válida no formato YYYY-MM-DD')
        
def ler_str(prompt: str) -> str:
    while True:
        valor = input(prompt)
        if valor.strip() != "":
            return valor
        print('Entrada vazia, digite algo.')

def ler_int(prompt: str) -> int:
    while True:
        try:
            valor = int(input(prompt))
            return valor
        except ValueError:
            print("Entrada inválida. Digite um número inteiro.")

def cadastrar_documento(documentos: List[dict], nome: str, data_validade: date, alerta_dias: int) -> None:
    if nome.strip() == "":
        raise ValueError('Digite o nome do documento.')
    if alerta_dias < 0:
        raise ValueError('O documento já está vencido.')
    documento = {'nome':nome, 'validade':data_validade, 'alerta':alerta_dias}
    documentos.append(documento)

def listar_documentos(documentos: list) -> None:
    if not documentos:
        print('Nenhum documento cadastrado.')
        return
    
    for documento in documentos:
        nome = documento['nome']
        validade = documento['validade']
        alerta = documento['alerta']
        dias_para_vencimento = validade - date.today()
        status = ''
        if dias_para_vencimento.days < 0:
            status = 'Vencido'
        elif dias_para_vencimento.days <= alerta:
            status = 'Alerta'
        else:
            status = 'Ok'
        print(f'{nome} | vence em {dias_para_vencimento.days} dia(s) | {status}')

def listar_alertas(documentos: list) -> None:
    if not documentos:
        print('Nenhum alerta cadastrado.')
        return
    alerta_encontrado = False
    for documento in documentos:
        nome = documento['nome']
        validade = documento['validade']
        alerta = documento['alerta']
        dias_para_vencimento = validade - date.today()
        status = ''
        if dias_para_vencimento.days < 0:
            status = 'Vencido'
        elif dias_para_vencimento.days <= alerta:
            status = 'Alerta'
        else:
            status = 'Ok'
        if status == 'Vencido':
            print(f'{nome} vencido.')
            alerta_encontrado = True
        elif status == 'Alerta':
            print(f'{nome} em alerta.')
            alerta_encontrado = True
    if alerta_encontrado == False:
        print('Nenhum documento vencido ou em alerta.')

def salvar_documento(documentos: List[dict], caminho: str) -> None:
    documentos_json = []
    for documento in documentos:
        nome = documento['nome']
        validade_str = str(documento['validade'])
        alerta = documento['alerta']
        doc_json = {'nome':nome, 'validade': validade_str, 'alerta': alerta}
        documentos_json.append(doc_json)
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(documentos_json, f, indent=2)

def carregar_documentos(caminho: str) -> List[dict]:
    Documentos = []
    try:
        with open(caminho, "r", encoding="utf-8") as f:
            documento = json.load(f)
            for dados in documento:
                nome = dados['nome']
                data_validade = dados['validade']
                data_format = '%Y-%m-%d'
                validade = datetime.strptime(data_validade, data_format).date()
                alerta = dados['alerta']
                doc = {'nome':nome, 'validade': validade, 'alerta': alerta}
                Documentos.append(doc)
            return Documentos
    except FileNotFoundError:
        return []
        
                
def mostrar_menu() -> None:
    print("\n=== GERENCIADOR DE DOCUMENTOS ===")
    print("1. Cadastrar documentos")
    print("2. Listar documentos")
    print("3. Ver alertas")
    print("4. Sair")

def main() -> None:
    
    caminho = "documentos.json"
    documentos = carregar_documentos(caminho)

    while True:

        mostrar_menu()
        opcao = ler_int('Escolha uma opção: ')

        if opcao == 1:
            nome = ler_str('Documento: ')
            validade = ler_data('Data de validade: YYYY-MM-DD: ')
            alerta = ler_int('Dias para alertar: ')
            try:
                cadastrar_documento(documentos, nome, validade, alerta)
                salvar_documento(documentos, caminho)
                print('Documento salvo com sucesso.')
            except ValueError as e:
                print(f'Erro: {e}')

        elif opcao == 2:
            listar_documentos(documentos)

        elif opcao == 3:
            listar_alertas(documentos)
        
        elif opcao == 4:
            salvar_documento(documentos, caminho)
            print('Saindo...')
            break

        else:
            print('Opção inválida. Tente novamente.')

if __name__ == "__main__":
    main()