from datetime import date, datetime
from typing import List
import json
from operator import itemgetter

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
    if alerta_dias < data_validade:
        raise ValueError('O documento já está vencido.')
    documento = {'nome':nome, 'validade':data_validade, 'alerta':alerta_dias}
    documentos.append(documento)

def calcular_status(documento: dict) -> tuple[int, str]:

    validade = documento['validade']
    alerta = documento['alerta']
    dias_para_vencimento = validade - date.today()
    if dias_para_vencimento.days < 0:
        status = 'Vencido'
    elif dias_para_vencimento.days <= alerta:
        status = 'Alerta'
    else:
        status = 'Ok'
    return dias_para_vencimento.days, status


def listar_documentos(documentos: list[dict]) -> None:
    if not documentos:
        print('Nenhum documento cadastrado.')
        return
    documentos_ordenados = sorted(documentos, key=itemgetter('validade', 'nome'))
    for documento in documentos_ordenados:
        nome = documento['nome']
        dias, status = calcular_status(documento)

        print(f'{nome} | vence em {dias} dia(s) | {status}')

def listar_documentos_com_indice(documentos: List[dict]):
    for indice, documento in enumerate(documentos, start=1):
        nome = documento['nome']
        dias, status = calcular_status(documento)
        print(f'{indice}) {nome} | vence em {dias} dia(s) | {status}')

def listar_alertas(documentos: list[dict]) -> None:
    if not documentos:
        print('Nenhum alerta cadastrado.')
        return
    alerta_encontrado = False
    for documento in documentos:
        nome = documento['nome']
        dias, status = calcular_status(documento)
        if status == "Vencido" or status == "Alerta":
            print(f'{nome} | {status} | vence em {dias} dia(s).')
            alerta_encontrado = True
    if not alerta_encontrado:
        print('Nenhum documento em alerta.')

def buscar_documentos(documentos: List[dict], termo) -> List[dict]:
    if not termo:
        raise ValueError('Nenhum dado digitado.')
    resultados = []
    for documento in documentos:
        nome = documento['nome']
        if termo.lower() in nome.lower():
            resultados.append(documento)
    return resultados

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
    print("4. Buscar documento")
    print("5. Remover documento")
    print("6. Editar documento")
    print("7. Sair")

def mostrar_menu_edicao() -> None:
    print("\n=== EDIÇÃO DE DOCUMENTOS ===")
    print("1. Editar nome")
    print("2. Editar validade")
    print("3. Editar alerta")
    print("4. Cancelar")

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
            try:
                termo = ler_str('Digite o nome: ')
                documentos_encontrados = buscar_documentos(documentos, termo)
                if not documentos_encontrados:
                    print('Nenhum documento encontrado')
                else:
                    listar_documentos(documentos_encontrados)
            except ValueError as e:
                print(f'Erro: {e}')

        elif opcao == 5:
            termo = ler_str('Qual documento deseja remover? ')
            resultados = buscar_documentos(documentos, termo)
            if not resultados:
                print('Nenhum documento encontrado.')
                continue
            else:
                listar_documentos_com_indice(resultados)
                indice = ler_int('Digite o número do documento que deseja remover: ')
                if indice < 1 or indice > len(resultados):
                    print('Número de documento inválido.')
                else:
                    doc_escolhido = resultados[indice - 1]
                    documentos.remove(doc_escolhido)
                    salvar_documento(documentos, caminho)
                    print('Documento removido com sucesso.')
        
        elif opcao == 6:
            termo = ler_str('Qual documento deseja editar? ')
            resultados = buscar_documentos(documentos, termo)
            if not resultados:
                print('Nenhum documento encontrado.')
                continue
            else:
                listar_documentos_com_indice(resultados)
                indice = ler_int('Digite o número do documento que deseja editar: ')
                if indice < 1 or indice > len(resultados):
                    print('Número de documento inválido.')
                    continue
                else:
                    doc_escolhido = resultados[indice - 1]
                    nome_antes = doc_escolhido['nome']
                    validade_antes = doc_escolhido['validade']
                    alerta_antes = doc_escolhido['alerta']
                    mostrar_menu_edicao()
                    alterou = False
                    dias_antes, status_antes = calcular_status(doc_escolhido)
                    opcao_edicao = ler_int('Escolha uma opção: ')
                    if opcao_edicao == 1:
                        novo_nome = ler_str('Digite o novo nome: ')
                        doc_escolhido['nome'] = novo_nome
                        alterou = True

                    elif opcao_edicao == 2:
                        nova_validade = ler_data('Digite a nova data de validade: YYYY-MM-DD')
                        doc_escolhido['validade'] = nova_validade
                        alterou = True
                    
                    elif opcao_edicao == 3:
                        while True:
                            novo_alerta = ler_int('Digite os dias para o novo alerta: ')
                            if novo_alerta < 0:
                                print('Valor inválido (não pode ser negativo) ')
                                continue
                            doc_escolhido['alerta'] = novo_alerta
                            alterou = True
                            break

                    elif opcao_edicao == 4:
                        print('Cancelando...')
                        continue
                    else:
                        print('Opção inválida. Tente novamente.')
                    if alterou:
                        nome_editado = doc_escolhido['nome']
                        dias_editado, status_editado = calcular_status(doc_escolhido)
                        print('Alteração pronta. Confirme.')
                        print('Antes')
                        print(f"{nome_antes} | validade {validade_antes} | vence em {dias_antes} dia(s) | alerta para {alerta_antes} dia(s) | {status_antes}")
                        print('Depois')
                        print(f"{nome_editado} | validade {doc_escolhido['validade']} | vence em {dias_editado} dia(s) | alerta para {doc_escolhido['alerta']} dia(s) | {status_editado}")
                        while True:
                            opcao_confirmacao = ler_str('Deseja salvar a alteração? (s/n)').strip().lower()
                            if opcao_confirmacao == 's':
                                salvar_documento(documentos, caminho)
                                print('Salvo com sucesso.')
                                break
                            elif opcao_confirmacao == 'n':
                                doc_escolhido['nome'] = nome_antes
                                doc_escolhido['validade'] = validade_antes
                                doc_escolhido['alerta'] = alerta_antes
                                print('Alterações descartadas.')
                                break
                            else:
                                print('Digite s ou n')





        elif opcao == 7:
            salvar_documento(documentos, caminho)
            print('Saindo...')
            break

        else:
            print('Opção inválida. Tente novamente.')

if __name__ == "__main__":
    main()