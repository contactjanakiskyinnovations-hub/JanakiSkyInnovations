import React from "react";
import Barcode from "react-barcode";
import { createRoot } from "react-dom/client";

/**
 * EInvoice
 *
 * Renders a printable tax-invoice-style document for an order.
 * The invoice data is sourced from the order's `eInvoice` field (auto-generated
 * by the backend when the order is marked Delivered) with a fallback to
 * deriving the data directly from the order object.
 *
 * Props:
 *   - order   : the full order object returned by GET /api/orders/:id
 *   - compact : when true, renders without the print-button wrapper (for
 *               in-page embedding, e.g. inside a modal)
 */

// A Mongo ObjectId is a 24-char hex string — never a valid product SKU.
const isHexObjectId = (value) =>
    typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);

// Pull the real product SKU from an order line item (sku captured at checkout,
// or the populated Product document).
const skuFromOrderItem = (orderItem) =>
    (orderItem &&
        (orderItem.sku ||
            (orderItem.product && typeof orderItem.product === "object" && orderItem.product.sku))) ||
    "";

// Resolve the SKU to display for an invoice line item: prefer the real SKU from
// the matching order line item (1:1 by index), fall back to any sanitized value
// already stored on the invoice item, and never leak the mongodb `_id`.
const displaySku = (item, index, order) => {
    const orderItem = (order && order.orderItems && order.orderItems[index]) || {};
    const orderSku = skuFromOrderItem(orderItem);
    if (orderSku) return orderSku;

    const cached =
        item && (item.shopSku || item.sellerSku || item.sku || (item.product && item.product.sku));
    return cached && !isHexObjectId(String(cached)) ? String(cached) : "—";
};

const EInvoice = ({ order, compact = false }) => {
    const inv = order?.eInvoice
        ? { ...order.eInvoice, items: order.eInvoice.items ?? [] }
        : buildInvoiceFromOrder(order);

    const formatMoney = (amount) =>
        Number(amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const invoiceDate = new Date().toLocaleString();

    return (
        <div className="invoice-page">
            <style>{`
                * { box-sizing: border-box; }
                .invoice-page { font-family: Arial, Helvetica, sans-serif; color: #111; }
                .invoice-wrapper { width: 210mm; min-height: 297mm; margin: 20px auto; background: white; padding: 12mm; }
                .invoice-offscreen { position: fixed; left: -9999px; top: 0; width: 210mm; }
                .invoice-page { width: 100%; }
                .invoice-header { display: grid; grid-template-columns: 160px 1fr; border: 1px solid #222; min-height: 125px; }
                .company-box { border-right: 1px solid #222; padding: 15px 10px; display: flex; flex-direction: column; justify-content: center; }
                .company-logo { font-size: 25px; font-weight: bold; letter-spacing: 1px; }
                .company-subtitle { font-size: 10px; margin-top: 4px; }
                .seller-center { display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .seller-title { font-size: 28px; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px; }
                .barcode-number { font-size: 11px; margin-bottom: 3px; }
                .barcode-container { display: flex; justify-content: center; }
                .barcode-container svg { max-width: 310px; height: 60px !important; }
                .invoice-meta { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 5px; }
                .info-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                .info-table td { border: 1px solid #222; padding: 7px; vertical-align: top; }
                .info-label { font-weight: bold; width: 14%; white-space: nowrap; }
                .info-value { width: 36%; line-height: 1.5; }
                .section-title { font-weight: bold; font-size: 12px; padding: 8px 0; margin-top: 18px; border: 1px solid #222; border-bottom: none; padding-left: 8px; }
                .items-table { width: 100%; border-collapse: collapse; font-size: 10px; }
                .items-table th, .items-table td { border: 1px solid #222; padding: 6px 5px; text-align: center; vertical-align: middle; }
                .items-table th { font-weight: bold; background: #fafafa; }
                .items-table .product-name { text-align: left; line-height: 1.4; }
                .items-table .sku { word-break: break-word; line-height: 1.3; }
                .items-table .size { line-height: 1.4; }
                .total-wrapper { width: 55%; margin-left: auto; margin-top: 25px; }
                .total-table { width: 100%; border-collapse: collapse; font-size: 11px; }
                .total-table td { border: 1px solid #222; padding: 7px; }
                .total-label { text-align: right; font-weight: 500; }
                .total-value { width: 110px; text-align: right; }
                .grand-total td { font-weight: bold; font-size: 13px; }
                .invoice-footer { margin-top: 30px; font-size: 9px; display: flex; justify-content: space-between; }
                .print-button-container { width: 210mm; margin: 15px auto; display: flex; justify-content: flex-end; }
                .print-button { border: none; background: #222; color: white; padding: 10px 20px; cursor: pointer; border-radius: 4px; }
                .print-button:hover { background: #444; }
                .invoice-wrapper--compact { width: 100%; min-height: auto; margin: 10px 0; padding: 6mm; }
                @media print {
                    @page { size: A4; margin: 8mm; }
                    body * { visibility: hidden; }
                    .invoice-page, .invoice-page * { visibility: visible; }
                                                            .invoice-page { position: fixed !important; left: 0 !important; top: 0 !important; width: 100%; z-index: 9999; }
                    .invoice-offscreen { position: static !important; left: auto !important; top: auto !important; width: auto !important; }
                    .invoice-wrapper { width: 100%; min-height: auto; margin: 0; padding: 0; }
                    .print-button-container { display: none; }
                    .items-table tr { page-break-inside: avoid; }
                    .info-table { page-break-inside: avoid; }
                    .total-wrapper { page-break-inside: avoid; }
                }
            `}</style>

            {!compact && (
                <div className="print-button-container">
                    <button className="print-button" onClick={() => window.print()}>Download Invoice</button>
                </div>
            )}

            <div className={`invoice-wrapper${compact ? " invoice-wrapper--compact" : ""}`}>
                                <div className="invoice-header">
                    <div className="company-box">
                        <div className="company-logo">JanakiSky</div>
                        <div className="company-subtitle">Innovations</div>
                    </div>
                    <div className="seller-center">
                        <div className="seller-title">SELLER CENTER</div>
                        <div className="barcode-number">{inv.purchaseSummaryNumber || order?._id}</div>
                        <div className="barcode-container">
                            <Barcode value={String(inv.purchaseSummaryNumber || order?._id)} format="CODE128" width={1.5} height={55} displayValue={false} margin={0} />
                        </div>
                        <div className="barcode-number">{inv.purchaseSummaryNumber || order?._id}</div>
                    </div>
                </div>

                <table className="info-table">
                    <tbody>
                        <tr>
                            <td className="info-label">Purchase Summary Number:</td>
                            <td className="info-value">{inv.purchaseSummaryNumber || order?._id}</td>
                            <td className="info-label">Payment Method:</td>
                            <td className="info-value">{inv.paymentMethod || order?.paymentMethod || "Cash on Delivery"}</td>
                        </tr>
                        <tr>
                            <td className="info-label">Purchase Summary Date:</td>
                            <td className="info-value">{inv.purchaseDate ? formatDate(inv.purchaseDate) : "N/A"}</td>
                            <td className="info-label">DELIVER TO:</td>
                            <td className="info-value">{inv.deliverTo?.name || "N/A"}</td>
                        </tr>
                        <tr>
                            <td className="info-label">BILL TO:</td>
                            <td className="info-value">{inv.billTo?.name || "N/A"}</td>
                            <td className="info-label">ADDRESS:</td>
                            <td className="info-value">{inv.billTo?.address || "N/A"}</td>
                        </tr>
                        <tr>
                            <td className="info-label">PHONE:</td>
                            <td className="info-value">{inv.billTo?.phone || "N/A"}</td>
                            <td></td><td></td>
                        </tr>
                                        </tbody>
                </table>

                <div className="section-title">Your Ordered Items:</div>
                <table className="items-table">
                    <thead>
                        <tr>
                            <th style={{ width: "4%" }}>#</th>
                            <th style={{ width: "21%" }}>Product Name</th>
                            <th style={{ width: "12%" }}>Shop SKU</th>
                            <th style={{ width: "12%" }}>Seller SKU</th>
                            <th style={{ width: "11%" }}>Size</th>
                            <th style={{ width: "6%" }}>Qty</th>
                            <th style={{ width: "8%" }}>Paid<br />price</th>
                            <th style={{ width: "8%" }}>Price</th>
                            <th style={{ width: "10%" }}>Item<br />Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inv.items.map((item, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td className="product-name">{item.productName}</td>
                                <td className="sku">{displaySku(item, index, order)}</td>
                                <td className="sku">{displaySku(item, index, order)}</td>
                                <td className="size">{item.size || "-"}</td>
                                <td>{item.quantity ?? "-"}</td>
                                <td>{formatMoney(item.paidPrice)}</td>
                                <td>{formatMoney(item.price)}</td>
                                <td>{formatMoney(item.itemTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="total-wrapper">
                    <table className="total-table">
                        <tbody>
                            <tr>
                                <td className="total-label">Subtotal:</td>
                                <td className="total-value">{formatMoney(inv.subtotal)}</td>
                            </tr>
                            <tr>
                                <td className="total-label">Shipping Cost:</td>
                                <td className="total-value">{formatMoney(inv.shippingCost)}</td>
                            </tr>
                            <tr>
                                <td className="total-label">Voucher:</td>
                                <td className="total-value">-{formatMoney(inv.voucher)}</td>
                            </tr>
                            <tr className="grand-total">
                                <td className="total-label">Total</td>
                                <td className="total-value">{formatMoney(inv.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="invoice-footer">
                    <span>Thank you for your purchase.</span>
                    <span>This is a computer generated invoice.</span>
                </div>
            </div>
        </div>
    );
};

/**
 * Fallback: derive an invoice-shaped object directly from the raw order,
 * used when `order.eInvoice` hasn't been generated yet (e.g. order not yet
 * delivered).
 */
const buildInvoiceFromOrder = (order) => {
    if (!order) return {};
    const sa = order.shippingAddress || {};
    const fullAddress = [sa.address, sa.city, sa.state, sa.zip, sa.country]
        .filter(Boolean)
        .join(", ") || "N/A";
        const buyerName = order.user?.name || order.user?.email || sa.name || "Customer";
    const phone = sa.phone || order.user?.mobile || order.user?.phone || "N/A";
    const items = (order.orderItems || []).map((item) => {
        const resolvedSku = item.sku || (item.product && item.product.sku) || "";
        return {
            productName: item.name || "Product",
            shopSku: resolvedSku,
            sellerSku: resolvedSku,
            size: "",
            paidPrice: item.price || 0,
            price: item.price || 0,
            quantity: item.qty || 0,
            itemTotal: Number((item.price * item.qty).toFixed(2)),
        };
    });
    return {
        purchaseSummaryNumber: "ORD" + (order._id || "").toString().slice(-8).toUpperCase(),
        purchaseDate: order.createdAt,
        paymentMethod: order.paymentMethod || "Cash on Delivery",
        billTo: { name: buyerName, address: fullAddress, phone },
        deliverTo: { name: buyerName, address: fullAddress, phone },
        items,
        subtotal: order.itemsPrice || 0,
        shippingCost: order.shippingPrice || 0,
        voucher: 0,
        total: order.totalPrice || 0,
        generatedAt: new Date(),
    };
};

const formatDate = (dateInput) => {
    try {
        return new Date(dateInput).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return "N/A";
    }
};

/**
 * Isolated printer for an order invoice.
 *
 * Opens a brand-new window that contains *only* the rendered invoice
 * (no header / footer / surrounding page chrome). Because the popup's body
 * holds the invoice alone, the invoice always starts on page 1 and the page
 * count grows automatically with the number of line items (1 page for small
 * orders, 2+ for large ones) — no blank first page and no duplicated chrome.
 *
 * The window is opened synchronously (inside the caller's click gesture) so it
 * is not blocked by popup blockers; the markup is populated a tick later once
 * react-barcode has painted its SVG.
 */
export const printOrderInvoice = (order) => {
    const win = window.open("", "_blank", "top=0,left=0,width=920,height=820");
    if (!win) {
        // Popup blocked — fall back to a normal in-page print.
        window.print();
        return;
    }

        const container = document.createElement("div");
    // Keep the temporary render off-screen so it never flashes on the live page.
    container.style.cssText = "position:absolute;left:-9999px;top:-9999px;visibility:hidden;";
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(React.createElement(EInvoice, { order }));

    setTimeout(() => {
        const page = container.querySelector(".invoice-page");
        if (!page) {
            root.unmount();
            container.remove();
            return;
        }
                const doc = win.document;
        doc.open();
        doc.write(
                        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tax Invoice</title>' +
                "</head><body>" +
                page.outerHTML +
                "</body></html>"
        );
        doc.close();
        win.focus();
        setTimeout(() => {
            win.print();
            root.unmount();
            container.remove();
        }, 250);
    }, 400);
};

export default EInvoice;


