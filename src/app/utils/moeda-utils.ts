export function formatarParaReal(valor: string | number): string {
  if (valor === null || valor === undefined || valor === '') return 'R$ 0,00';

  // Limpa o valor mantendo apenas dígitos numéricos
  let limpo = valor.toString().replace(/\D/g, '');
  if (!limpo) return 'R$ 0,00';

  // Converte para decimal (centavos)
  const numero = (parseInt(limpo, 10) / 100).toFixed(2);

  // Aplica a formatação brasileira regionalizada
  return 'R$ ' + numero
    .replace('.', ',')
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}

export function converterRealParaNumero(valorFormatado: string): number {
  if (!valorFormatado) return 0;
  // Remove o 'R$', pontos de milhar e substitui a vírgula decimal por ponto
  const stringNumerica = valorFormatado
    .replace('R$', '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  return parseFloat(stringNumerica) || 0;
}
