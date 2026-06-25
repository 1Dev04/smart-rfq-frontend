// utils/statusMap.js
export const STATUS_LABEL = {
  user_fill:         "Draft",
  purchase_accept:   "Purchase Accept",
  waiting_quotation: "Waiting Quotation",
  purchase_compare:  "Purchase Compare",
  user_confirm:      "User Confirm",
  purchase_confirm:  "Purchase Confirm",
  finish:            "Finish",
  reject:            "Reject",
  cancel:            "Cancel",
};

export const STATUS_OPTIONS = [
  { label: "All",               value: "" },
  { label: "Draft",             value: "user_fill" },
  { label: "Purchase Accept",   value: "purchase_accept" },
  { label: "Waiting Quotation", value: "waiting_quotation" },
  { label: "Purchase Compare",  value: "purchase_compare" },
  { label: "User Confirm",      value: "user_confirm" },
  { label: "Purchase Confirm",  value: "purchase_confirm" },
  { label: "Finish",            value: "finish" },
  { label: "Reject",            value: "reject" },
  { label: "Cancel",            value: "cancel" },
];