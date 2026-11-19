import functions from "./functions";

const EvaluationLogs = (() => {
    const endpoint = "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/GetEvaluationFiles";
    const imageExtensions = ["png", "jpg", "jpeg", "gif", "svg", "webp"];

    let files = [];
    let table = null;

    // ===============================
    // Parse "/Date(1793090721000)/"
    // ===============================
    const parseSpDate = (value) => {
        const match = /\/Date\((\d+)\)\//.exec(value || "");
        return match ? moment(Number(match[1])) : null;
    };

    // ===============================
    // Print a single file
    // ===============================
    const printFile = (file) => {
        if (!file) return;

        const ext = (file.Name.split(".").pop() || "").toLowerCase();

        // Images: open in a new window containing only the image, then print
        if (imageExtensions.includes(ext)) {
            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                functions.warningAlert("من فضلك قم بالسماح بالنوافذ المنبثقة للطباعة");
                return;
            }
            printWindow.document.write(`
                <!doctype html>
                <html>
                <head><title>${file.Name}</title></head>
                <body style="margin:0; text-align:center;">
                    <img src="${file.Url}" style="max-width:100%;" onload="window.print();">
                </body>
                </html>`);
            printWindow.document.close();
            return;
        }

        // PDF: print through a hidden iframe so only this file is printed
        if (ext === "pdf") {
            const iframe = $("<iframe>")
                .css({ position: "fixed", width: 0, height: 0, border: 0, right: 0, bottom: 0 })
                .attr("src", file.Url)
                .appendTo("body");

            iframe.on("load", function () {
                try {
                    this.contentWindow.focus();
                    this.contentWindow.print();
                } catch (err) {
                    // Cross-origin or blocked: fall back to opening the file
                    window.open(file.Url, "_blank");
                }
                setTimeout(() => iframe.remove(), 60000);
            });
            return;
        }

        // Other types (Office files): open them so the user can print from the viewer
        window.open(file.Url, "_blank");
    };

    // ===============================
    // Render the DataTable
    // ===============================
    const render = () => {
        if (table) {
            table.destroy();
            table = null;
        }

        const rows = files.map((file, index) => [
            `<a href="${file.Url}" target="_blank" rel="noopener" style="color:#000;">${file.Name}</a>`,
            parseSpDate(file.Created)?.format("DD-MM-YYYY hh:mm A") || "-",
            `<button type="button" class="btnStyle confirmBtnGreen popupBtn printEvaluationFile" data-index="${index}">
                <i class="fa fa-print"></i> طباعة
             </button>`
        ]);

        table = $("#evaluationLogTable").DataTable({
            data: rows,
            paging: false,
            searching: false,
            ordering: false,
            info: false,
            responsive: true,
            autoWidth: false,
            language: {
                emptyTable: "لا توجد نماذج تقييم لهذه المخالفة"
            }
        });
    };

    // ===============================
    // Load files and open the modal
    // ===============================
    const open = (violationId, violationCode) => {
        $(".overlay").addClass("active");

        $.ajax({
            type: "POST",
            url: endpoint,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify({ id: Number(violationId) }),
            success: (data) => {
                files = Array.isArray(data?.d) ? data.d : [];
                $(".evaluation-log-violation-code").text(violationCode || "");
                $("#evaluationLogModal").modal("show");
            },
            error: (xhr) => {
                console.error("Error loading evaluation files:", xhr);
                functions.errorAlert("حدث خطأ أثناء تحميل نماذج التقييم");
            },
            complete: () => {
                $(".overlay").removeClass("active");
            }
        });
    };

    // ===============================
    // Init
    // ===============================
    const init = () => {
        // Open popup from the menu link
        $(document)
            .off("click.evalLog", ".evaluationLog")
            .on("click.evalLog", ".evaluationLog", function (e) {
                e.preventDefault();
                e.stopPropagation();
                open($(this).data("violationid"), $(this).data("violationcode"));
            });

        // Print one record
        $(document)
            .off("click.evalLogPrint", ".printEvaluationFile")
            .on("click.evalLogPrint", ".printEvaluationFile", function (e) {
                e.preventDefault();
                e.stopPropagation();
                printFile(files[Number($(this).data("index"))]);
            });

        // Render table once the modal is visible (avoids DataTables width issues)
        $("#evaluationLogModal")
            .off("shown.bs.modal.evalLog")
            .on("shown.bs.modal.evalLog", render);

        // Clean up on close
        $("#evaluationLogModal")
            .off("hidden.bs.modal.evalLog")
            .on("hidden.bs.modal.evalLog", () => {
                if (table) {
                    table.destroy();
                    table = null;
                }
                $("#evaluationLogTable tbody").empty();
                $(".evaluation-log-violation-code").text("");
                files = [];
            });
    };

    return { init };
})();

export default EvaluationLogs;