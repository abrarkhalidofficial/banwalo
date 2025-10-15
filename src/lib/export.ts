export function exportToCsv<T extends Record<string, any>>(filename: string, rows: T[]) {
  if (!rows || rows.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const header = Object.keys(rows[0]);
  const csv = [
    header.join(","),
    ...rows.map((row) =>
      header.map((fieldName) => {
        const value = row[fieldName];
        return value !== undefined && value !== null ? JSON.stringify(value) : "";
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}