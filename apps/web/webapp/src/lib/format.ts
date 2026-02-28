export function formatMoneyFromPaise(value: number) {
  return `INR ${(value / 100).toFixed(2)}`;
}

export function formatDecimalMoney(value: string) {
  return `INR ${Number(value).toFixed(2)}`;
}
