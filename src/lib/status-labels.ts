export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    received: "Received",
    paid: "Paid",
    awaiting_data: "Needs Details",
    ready_for_generation: "Ready to Generate",
    pending_review: "Pending Review",
    approved: "Approved",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return (
    labels[status] ||
    status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
