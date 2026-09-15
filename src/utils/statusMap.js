const STATUS_LABEL = {
  user_draft: "Draft",
  user_pending: "Pending",
  waiting_quotation: "Waiting Quo.",
  purchase_compare: "PUR Comp.",
  user_confirm: "User Confirm",
  cost_saving: "Cost Saving",
  purchase_confirm: "PUR Confirm",
  finish: "Finish",
  reject: "Reject",
  cancel: "Cancel",
  error: "Error"
};

const STATUS_BADGE_CLASS = {
  user_draft: "badge-draft",
  user_pending: "badge-pending",
  waiting_quotation: "badge-waiting-quotation",
  purchase_compare: "badge-purchase-compare",
  user_confirm: "badge-user-confirm",
  cost_saving: "badge-cost-saving",
  purchase_confirm: "badge-purchase-confirm",
  finish: "badge-finish",
  reject: "badge-reject",
  error: "badge-error",
  cancel: "badge-cancel",
};

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Draft", value: "user_draft" },
  { label: "Pending", value: "user_pending" },
  { label: "Waiting Quotation", value: "waiting_quotation" },
  { label: "Purchase Compare", value: "purchase_compare" },
  { label: "User Confirm", value: "user_confirm" },
  { label: "Cost Saving", value: "cost_saving"},
  { label: "Purchase Confirm", value: "purchase_confirm" },
  { label: "Finish", value: "finish" },
  { label: "Reject", value: "reject" },
  { label: "Cancel", value: "cancel" },
  { label: "Error", value: "error" },
];

export default { STATUS_LABEL, STATUS_BADGE_CLASS, STATUS_OPTIONS };