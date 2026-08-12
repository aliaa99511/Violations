import functions from "./functions";

const ViolationHistoryLogs = (() => {
    let selectedViolationId = null;
    let selectedViolationCode = null;
    let trackHistoryTable = null;
    let containerSelector = null;
    let historyData = []; // Store loaded history data for printing
    let isDataLoaded = false; // Track if data has been loaded

    // ===============================
    // إغلاق المودال
    // ===============================
    const closeModal = () => {
        $("#trackHistoryModal").modal("hide");

        // Clear the modal content
        $(".track-history-violation-code").text("");
        if (trackHistoryTable) {
            trackHistoryTable.clear().destroy();
            trackHistoryTable = null;
        }
        $("#trackHistoryTable tbody").empty();
        historyData = [];
        isDataLoaded = false;
        updatePrintButtonState();
    };
    const PrintViolationHistory = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isDataLoaded || historyData.length === 0) {
            functions.warningAlert("لا توجد بيانات للطباعة");
            return;
        }

        const printForm = $("#printJS-form");
        // const printForm = $(e.currentTarget).closest(".modal").find("#printJS-form");

        if (!printForm.length) {
            functions.warningAlert("لا يوجد محتوى للطباعة");
            return;
        }

        // Hide buttons before printing
        const formButtonsBox = printForm.find(".formButtonsBox");

        if (formButtonsBox.length) {
            formButtonsBox.hide();
        }

        // Use the same printing mechanism as printPaymentFormOnly
        functions.PrintDetails(e);

        // Restore buttons after printing
        setTimeout(() => {
            if (formButtonsBox.length) {
                formButtonsBox.show();
            }
        }, 1000);
    };
    // ===============================
    // Update Print Button State
    // ===============================
    const updatePrintButtonState = () => {
        const printBtn = $("#printViolationHistoryFooter");
        if (printBtn.length) {
            if (!isDataLoaded || historyData.length === 0) {
                printBtn.addClass("disabled").css({
                    "opacity": "0.5",
                    "pointer-events": "none",
                    "cursor": "not-allowed"
                });
            } else {
                printBtn.removeClass("disabled").css({
                    "opacity": "1",
                    "pointer-events": "auto",
                    "cursor": "pointer"
                });
            }
        }
    };

    // ===============================
    // Print History Function
    // ===============================
    const printHistory = () => {
        if (!isDataLoaded || historyData.length === 0) {
            functions.warningAlert("لا توجد بيانات للطباعة");
            return;
        }

        // Generate HTML content matching printPaymentForm structure
        let printHistoryHtml = `
            <div class="paymentFormPrintBox paymentFormPrintBoxHistoryLog" id="printJS-form">
                <div class="popupBigWrapper">
                    <div class="popupSectionWrapper">
                        <div class="WaterMark">
                        </div>
                        <div class="formTitle">تتبع مرحلة المخالفة</div>
                        <div class="popupHeader" style="margin-bottom: 0;">
                            <div class="violationsMetaBox" style="${functions.getSiteName() == "ViolationsRecorder" ? "border: 2px solid #083a77;color: #083a77" : "border: 2px solid #015642;color: #015642;"}">
                                <p class="violationCode">مخالفة رقم (${selectedViolationCode || '-'})</p>
                                <p class="violationPrintTime">تاريخ وتوقيت الطباعة : ${functions.getCurrentDateTime ? functions.getCurrentDateTime("DateTime") : new Date().toLocaleString('ar-EG')}</p>
                            </div>
                        </div>

                        <div class="popupBody violationPrintFormBody violationDetailsBody">
                            <div class="popupForm printPaymentDetailsPopup" id="printPaymentDetailsPopup">
                                <div class="formContent">
                                    <div class="payRowData">
                                        <div class="row">
                                           <!-- <div class="col-md-3">
                                                <div class="headOfSection">
                                                    <p class="SectionTitle">تفاصيل تتبع المخالفة :</p>
                                                </div>
                                            </div> -->
                                            <div class="col-md-12">
                                                <div class="formBox">
                                                    <div class="formElements">
                                                        <div class="table-responsive">
                                                            <table class="table table-bordered table-striped">
                                                                <thead>
                                                                    <tr>
                                                                        <th style="color: #000;">م</th>
                                                                        <th style="color: #000;">الإجراء</th>
                                                                        <th style="color: #000;">تاريخ الإجراء</th>
                                                                        <th style="color: #000;">القائم بالإجراء</th>
                                                                        <th style="color: #000;">ملاحظات</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    ${historyData.map((item, index) => `
                                                                        <tr>
                                                                            <td>${index + 1}</td>
                                                                            <td>${item.Status || '-'}</td>
                                                                            <td>${item.Created ? functions.getFormatedDate(item.Created) : '-'}</td>
                                                                            <td>${item.CreatedBy || '-'}</td>
                                                                            <td>${item.Comment || '-'}</td>
                                                                        </tr>
                                                                    `).join('')}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-12">
                        <div class="formButtonsBox">
                            <div class="col-12">
                                <div class="buttonsBox centerButtonsBox">
                                    <button
                                        type="button"
                                        class="btnStyle ${functions.getSiteName() == "ViolationsRecorder" ? "confirmBtnBlue" : "confirmBtnGreen"} popupBtn printHistoryForm"
                                        id="printHistoryForm">
                                        طباعة
                                    </button>

                                    <button
                                        type="button"
                                        class="btnStyle cancelBtn popupBtn closePrintHistoryPopup"
                                        id="closePrintHistoryPopup">
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        functions.declarePopupViolationHistory("generalPopupStyle paymentFormDetailsPopup", printHistoryHtml);

        setTimeout(() => {
            // Print button handler
            $(document)
                // .off("click", ".printHistoryForm")
                .on("click", ".printHistoryForm", PrintViolationHistory);

            // Close button handler - bind to document for dynamically created elements
            $(document)
                .off("click", "#closePrintHistoryPopup")
                .on("click", "#closePrintHistoryPopup", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    closePrintPopup();
                });
        }, 100);
    };

    // ===============================
    // Close Print Popup
    // ===============================
    const closePrintPopup = () => {
        const modal = $("#printJS-form").closest(".modal");

        modal.modal("hide");

        modal.one("hidden.bs.modal", function () {
            $(this).remove();
        });
    };
    // ===============================
    // Show No Data Message
    // ===============================
    const showNoDataMessage = () => {
        const tableBody = $("#trackHistoryTable tbody");
        if (tableBody.length) {
            tableBody.html(`
                <tr>
                    <td colspan="5" class="text-center" style="padding: 30px 20px;">
                        <div style="color: #6c757d; font-size: 16px;">
                            <i class="fas fa-info-circle" style="font-size: 24px; display: block; margin-bottom: 10px;"></i>
                            لا توجد سجلات تاريخ لهذه المخالفة
                        </div>
                    </td>
                </tr>
            `);
        }
    };

    // ===============================
    // Bind close events
    // ===============================
    const bindCloseEvents = () => {
        // Close button in header
        $(document).off("click", "#closeViolationHistoryPopup").on("click", "#closeViolationHistoryPopup", function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });

        // Close button in footer (if exists)
        $(document).off("click", "#closeViolationHistoryPopupFooter").on("click", "#closeViolationHistoryPopupFooter", function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });

        // Print button in footer - update state and handle click
        $(document).off("click", "#printViolationHistoryFooter").on("click", "#printViolationHistoryFooter", function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (!isDataLoaded || historyData.length === 0) {
                functions.warningAlert("لا توجد بيانات للطباعة، يرجى الانتظار حتى تحميل البيانات");
                return;
            }

            printHistory();
        });

        // Bootstrap modal hide event
        $("#trackHistoryModal").off("hidden.bs.modal").on("hidden.bs.modal", function () {
            closeModal();
        });
    };

    // ===============================
    // Open modal handler
    // ===============================
    const bindOpenEvents = () => {
        // First, remove any existing click handlers for .violationHistory
        if (containerSelector) {
            $(containerSelector).off("click", ".violationHistory");
        } else {
            $(document).off("click", ".violationHistory");
        }

        // Then bind the new handler
        $(containerSelector || document).on("click", ".violationHistory", function (e) {
            e.preventDefault();
            e.stopPropagation();

            selectedViolationId = $(this).data("violationid");
            selectedViolationCode = $(this).data("violationcode");

            // Reset data loaded state
            isDataLoaded = false;
            historyData = [];
            updatePrintButtonState();

            $("#trackHistoryModal").modal("show");
        });
    };

    // ===============================
    // Load data when modal is shown
    // ===============================
    const loadHistoryData = () => {
        $(".track-history-modal").off("shown.bs.modal").on("shown.bs.modal", function () {
            $(".track-history-violation-code").text(selectedViolationCode || "");

            const request = {
                Request: {
                    ViolationId: selectedViolationId,
                },
            };

            const tableElement = $("#trackHistoryTable");

            // Show loading state
            const tableBody = $("#trackHistoryTable tbody");
            if (tableBody.length) {
                tableBody.html(`
                    <tr>
                        <td colspan="5" class="text-center" style="padding: 30px 20px;">
                            <div style="color: #6c757d; font-size: 16px;">
                                <i class="fas fa-spinner fa-spin" style="font-size: 24px; display: block; margin-bottom: 10px;"></i>
                                جاري تحميل البيانات...
                            </div>
                        </td>
                    </tr>
                `);
            }

            if (!trackHistoryTable) {
                trackHistoryTable = tableElement.DataTable({
                    // processing: true,
                    paging: false,
                    responsive: true,
                    destroy: true,
                    ajax: {
                        url: "/_layouts/15/Uranium.Violations.SharePoint/ViolationHistoryLogs.aspx/Search",
                        type: "POST",
                        contentType: "application/json",
                        data: () => JSON.stringify(request),
                        dataSrc: (data) => {
                            const gridData = data?.d?.Result?.GridData || [];
                            historyData = gridData; // Store for printing
                            isDataLoaded = true;

                            // Update print button state based on data
                            updatePrintButtonState();

                            // If no data, show message
                            if (gridData.length === 0) {
                                setTimeout(() => {
                                    showNoDataMessage();
                                }, 100);
                            }

                            return gridData;
                        },
                        error: function (xhr, status, error) {
                            console.error("Error loading history data:", error);
                            isDataLoaded = true;
                            updatePrintButtonState();
                            showNoDataMessage();
                            functions.errorAlert("حدث خطأ أثناء تحميل البيانات");
                        }
                    },
                    columns: [
                        {
                            title: "م",
                            data: null,
                            render: (data, type, row, meta) => meta.row + 1
                        },
                        {
                            title: "الإجراء",
                            data: "Status",
                            render: (data) => data || "-"
                        },
                        {
                            title: "تاريخ الإجراء",
                            data: "Created",
                            render: (data) => data ? functions.getFormatedDate(data) : "-"
                        },
                        {
                            title: "القائم بالإجراء",
                            data: "CreatedBy",
                            render: (data) => data || "-"
                        },
                        {
                            title: "ملاحظات",
                            data: "Comment",
                            render: (data) => data || "-"
                        }
                    ],
                    language: {
                        emptyTable: "لا توجد بيانات",
                        // processing: '<div style="padding: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i><br>جاري التحميل...</div>'
                    },
                    drawCallback: function () {
                        // Update historyData with current table data
                        const api = this.api();
                        const data = api.data().toArray();
                        historyData = data.length > 0 ? data : [];

                        // If no data after draw, show message
                        if (historyData.length === 0 && isDataLoaded) {
                            showNoDataMessage();
                        }

                        // Update print button state
                        updatePrintButtonState();
                    }
                });
            } else {
                trackHistoryTable.ajax.reload();
            }
        });
    };

    // ===============================
    // Clean up on modal hide
    // ===============================
    const bindHideEvent = () => {
        $(".track-history-modal").off("hidden.bs.modal").on("hidden.bs.modal", function () {
            $(".track-history-violation-code").text("");
            if (trackHistoryTable) {
                trackHistoryTable.clear().destroy();
                trackHistoryTable = null;
            }
            $("#trackHistoryTable tbody").empty();
            historyData = [];
            isDataLoaded = false;
            updatePrintButtonState();
        });
    };

    // ===============================
    // Initialize function
    // ===============================
    const init = (container = null) => {
        containerSelector = container;

        bindCloseEvents();
        bindOpenEvents();
        loadHistoryData();
        bindHideEvent();

        // Initially disable print button
        setTimeout(() => {
            updatePrintButtonState();
        }, 100);
    };

    // ===============================
    // Destroy function (cleanup)
    // ===============================
    const destroy = () => {
        closeModal();

        // Remove event listeners
        $(document).off("click", "#closeViolationHistoryPopup");
        $(document).off("click", "#closeViolationHistoryPopupFooter");
        $(document).off("click", "#printViolationHistoryFooter");
        $("#trackHistoryModal").off("hidden.bs.modal");
        $(".track-history-modal").off("shown.bs.modal hidden.bs.modal");

        if (containerSelector) {
            $(containerSelector).off("click", ".violationHistory");
        } else {
            $(document).off("click", ".violationHistory");
        }

        containerSelector = null;
        isDataLoaded = false;
        historyData = [];
    };

    // Public API
    return {
        init,
        destroy,
        closeModal,
        printHistory
    };
})();

export default ViolationHistoryLogs;