export type FinancialClassification =
  | "CUSTOMER_PAYMENT" | "OTHER_INCOME" | "DIRECT_COST" | "OPERATING_EXPENSE"
  | "OWNER_WITHDRAWAL" | "TAX" | "LOAN_PRINCIPAL" | "ASSET_PURCHASE" | "REFUND" | "UNCLASSIFIED";
export type CashTransaction = { type: "INCOME" | "EXPENSE"; classification: FinancialClassification | string; amount: number | string };
export type OrderSnapshot = { amount: number | string; status: string; recognizedInPeriod?: boolean; payments: Array<{ amount: number | string }> };

/** Convert a decimal currency amount to integer minor units before addition/subtraction. */
export function toMinorUnits(value: number | string): number {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) throw new Error("Nominal harus berupa angka yang valid.");
  return Math.round((amount + Number.EPSILON) * 100);
}
export function fromMinorUnits(value: number): number { return value / 100; }
function sumMinor(values: Array<number | string>): number { return values.reduce<number>((sum, value) => sum + toMinorUnits(value), 0); }

/**
 * Operational snapshot, not statutory accounting. Revenue is recognized on delivered orders;
 * payments are cash receipts; receivables are open order balances. Unclassified legacy records
 * are deliberately excluded from profit figures and reported separately.
 */
export function calculateFinancialSnapshot(input: {
  orders: OrderSnapshot[]; payments: Array<{ amount: number | string }>;
  transactions: CashTransaction[];
}) {
  const activeOrders = input.orders.filter((order) => order.status !== "CANCELLED");
  const recognizedRevenueMinor = sumMinor(activeOrders.filter((order) => order.status === "DELIVERED" && order.recognizedInPeriod !== false).map((order) => order.amount));
  const receivablesMinor = activeOrders.reduce((sum, order) => {
    const paid = sumMinor(order.payments.map((payment) => payment.amount));
    return sum + Math.max(0, toMinorUnits(order.amount) - paid);
  }, 0);
  const cashCollectedMinor = sumMinor(input.payments.map((payment) => payment.amount));
  const directCostsMinor = sumMinor(input.transactions.filter((tx) => tx.type === "EXPENSE" && tx.classification === "DIRECT_COST").map((tx) => tx.amount));
  const operatingExpensesMinor = sumMinor(input.transactions.filter((tx) => tx.type === "EXPENSE" && tx.classification === "OPERATING_EXPENSE").map((tx) => tx.amount));
  const otherIncomeMinor = sumMinor(input.transactions.filter((tx) => tx.type === "INCOME" && tx.classification === "OTHER_INCOME").map((tx) => tx.amount));
  const refundsMinor = sumMinor(input.transactions.filter((tx) => tx.type === "EXPENSE" && tx.classification === "REFUND").map((tx) => tx.amount));
  const cashInMinor = sumMinor(input.transactions.filter((tx) => tx.type === "INCOME").map((tx) => tx.amount));
  const cashOutMinor = sumMinor(input.transactions.filter((tx) => tx.type === "EXPENSE").map((tx) => tx.amount));
  const unclassifiedInMinor = sumMinor(input.transactions.filter((tx) => tx.type === "INCOME" && tx.classification === "UNCLASSIFIED").map((tx) => tx.amount));
  const unclassifiedOutMinor = sumMinor(input.transactions.filter((tx) => tx.type === "EXPENSE" && tx.classification === "UNCLASSIFIED").map((tx) => tx.amount));
  const grossProfitMinor = recognizedRevenueMinor - directCostsMinor;
  const netOperatingProfitMinor = grossProfitMinor + otherIncomeMinor - operatingExpensesMinor - refundsMinor;
  return {
    recognizedRevenue: fromMinorUnits(recognizedRevenueMinor), cashCollected: fromMinorUnits(cashCollectedMinor),
    receivables: fromMinorUnits(receivablesMinor), directCosts: fromMinorUnits(directCostsMinor),
    grossProfit: fromMinorUnits(grossProfitMinor), operatingExpenses: fromMinorUnits(operatingExpensesMinor),
    otherIncome: fromMinorUnits(otherIncomeMinor), refunds: fromMinorUnits(refundsMinor), netOperatingProfit: fromMinorUnits(netOperatingProfitMinor),
    cashInflow: fromMinorUnits(cashInMinor), cashOutflow: fromMinorUnits(cashOutMinor),
    netCashFlow: fromMinorUnits(cashInMinor - cashOutMinor),
    unclassifiedInflows: fromMinorUnits(unclassifiedInMinor), unclassifiedOutflows: fromMinorUnits(unclassifiedOutMinor),
  };
}

/** Aggregate-friendly variant for dashboards; input values must already be filtered to the reporting period. */
export function calculateFinancialSummary(input: {
  recognizedRevenue: number | string;
  activeOrderValue: number | string;
  activeOrderPayments: number | string;
  cashCollected: number | string;
  transactionTotals: CashTransaction[];
}) {
  const recognizedRevenueMinor = toMinorUnits(input.recognizedRevenue);
  const activeOrderValueMinor = toMinorUnits(input.activeOrderValue);
  const activeOrderPaymentsMinor = toMinorUnits(input.activeOrderPayments);
  const cashCollectedMinor = toMinorUnits(input.cashCollected);
  const total = (type: string, classification?: string) => sumMinor(input.transactionTotals.filter(row => row.type === type && (classification === undefined || row.classification === classification)).map(row => row.amount));
  const directCostsMinor = total("EXPENSE", "DIRECT_COST");
  const operatingExpensesMinor = total("EXPENSE", "OPERATING_EXPENSE");
  const otherIncomeMinor = total("INCOME", "OTHER_INCOME");
  const refundsMinor = total("EXPENSE", "REFUND");
  const cashInMinor = total("INCOME");
  const cashOutMinor = total("EXPENSE");
  const unclassifiedInMinor = total("INCOME", "UNCLASSIFIED");
  const unclassifiedOutMinor = total("EXPENSE", "UNCLASSIFIED");
  const grossProfitMinor = recognizedRevenueMinor - directCostsMinor;
  const netOperatingProfitMinor = grossProfitMinor + otherIncomeMinor - operatingExpensesMinor - refundsMinor;
  return {
    recognizedRevenue: fromMinorUnits(recognizedRevenueMinor), cashCollected: fromMinorUnits(cashCollectedMinor),
    receivables: fromMinorUnits(Math.max(0, activeOrderValueMinor - activeOrderPaymentsMinor)),
    directCosts: fromMinorUnits(directCostsMinor), grossProfit: fromMinorUnits(grossProfitMinor),
    operatingExpenses: fromMinorUnits(operatingExpensesMinor), otherIncome: fromMinorUnits(otherIncomeMinor),
    refunds: fromMinorUnits(refundsMinor), netOperatingProfit: fromMinorUnits(netOperatingProfitMinor),
    cashInflow: fromMinorUnits(cashInMinor), cashOutflow: fromMinorUnits(cashOutMinor),
    netCashFlow: fromMinorUnits(cashInMinor - cashOutMinor),
    unclassifiedInflows: fromMinorUnits(unclassifiedInMinor), unclassifiedOutflows: fromMinorUnits(unclassifiedOutMinor),
  };
}
