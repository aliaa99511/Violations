import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";
import ViolationHistoryLogs from "../../Shared/ViolationHistoryLogs";

let ExternalViolationLog = {
    pageIndex: 1,
    destroyTable: false
};

ExternalViolationLog.getExternalViolations = (
    pageIndex = 1,
    destroyTable = false,
) => {
    const selectedStatus =
        $("#ViolationStatus").children("option:selected").val();

    let request = {
        Data: {
            RowsPerPage: 10,
            PageIndex: pagination.currentPage,
            ColName: "created",
            SortOrder: "desc",
            IsExternalRecord: true,
            CaseNumber: $("#caseNumber").val(),
            ViolationCode: $("#violationCode").val(),
            OffenderType: $("#violationCategory").val(),
            ViolationType: Number($("#TypeofViolation").children("option:selected").data("id")),
            Status: selectedStatus,
            ViolatorCompany: $("#violatorCompany").val(),
            AssignedProsecution: $("#assignedProsecution").val(),
            ViolationsZone: $("#violationZone").val(),
            CreatedFrom: $("#createdFrom").val()
                ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
            CreatedTo: $("#createdTo").val()
                ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
        }
    };

    $(".overlay").addClass("active");
    functions
        .requester("_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", {
            request,
        })
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            $(".overlay").removeClass("active");
            let ExternalViolationDate = [];
            let ItemsData = data.d.Result;
            if (data.d.Result.GridData != null) {
                if (data.d.Result.GridData.length > 0) {
                    Array.from(data.d.Result.GridData).forEach((element) => {
                        ExternalViolationDate.push(element);
                    });
                } else {
                    ExternalViolationDate = [];
                }
            }

            ExternalViolationLog.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
            ExternalViolationLog.ExternalViolationTable(ExternalViolationDate, destroyTable);
            ExternalViolationLog.pageIndex = ItemsData.CurrentPage;
        })
        .catch((err) => {
            $(".overlay").removeClass("active");
            console.log(err);
        });
};
ExternalViolationLog.setPaginations = (TotalPages, RowsPerPage) => {
    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", ExternalViolationLog.getExternalViolations);
    pagination.activateCurrentPage();
};
ExternalViolationLog.filterExternalViolations = () => {
    let pageIndex = ExternalViolationLog.pageIndex;

    let violationType = Number($("#TypeofViolation").children("option:selected").data("id"));

    $(".overlay").addClass("active");

    ExternalViolationLog.getExternalViolations(
        pageIndex,
        true,
        violationType
    );
};
ExternalViolationLog.resetFilter = (e) => {
    e.preventDefault();

    $("#caseNumber").val("");
    $("#violationCode").val("");
    $("#violationCategory").val("");
    $("#TypeofViolation").val("0");
    $("#ViolationStatus").val("");
    $("#violatorCompany").val("");
    $("#assignedProsecution").val("");
    $("#violationZone").val("");
    $("#createdFrom").val("");
    $("#createdTo").val("");

    // Re-enable field
    $("#TypeofViolation").prop("disabled", false);

    pagination.reset();
    $(".overlay").addClass("active");
    ExternalViolationLog.getExternalViolations();
};
ExternalViolationLog.handleViolationCategoryChange = () => {

    $("#violationCategory").on("change", function () {
        const selectedCategory = $(this).val();
        const $typeOfViolationField = $("#TypeofViolation");

        $typeOfViolationField.prop("disabled", false);

        if (
            selectedCategory === "Equipment" ||
            selectedCategory === "Vehicle"
        ) {
            $typeOfViolationField.prop("disabled", true).val("0");
        }
    });

};
ExternalViolationLog.ExternalViolationTable = (ExternalViolationDate, destroyTable) => {
    let data = [];

    if (ExternalViolationDate.length > 0) {
        ExternalViolationDate.forEach(record => {
            let v = record.Violation;
            if (!v) return;

            let violationStatus = record.Status || record.StatusAr || "";
            let isCancelled = violationStatus === "Cancelled";
            let currentAmount = v?.TotalPriceDue;
            // const TotalInstallment = Number(((v.TotalPriceDue || 0) - (v.RemainingAmount || 0)).toFixed(2));

            let actionButtons = "";

            if (!isCancelled) {
                if (violationStatus === "UnderPayment") {
                    actionButtons += `
                        <li><a href="#" class="payInstallment">تسديد قسط</a></li>
                    `;
                }

                if (violationStatus !== "Paid") {
                    actionButtons += `
                        <li><a href="#" class="payViolation">تسديد المخالفة</a></li>
                        <li><a href="#" class="saveExternalCaseAction">حفظ وإلغاء قرار النيابة</a></li>
                    `;
                }

                if (!v.IsInstallment && violationStatus !== "Paid" && violationStatus !== "UnderPayment") {
                    actionButtons += `
                        <li><a href="#" class="editViolationAmountAction">تعديل مبلغ السداد</a></li>
                    `;
                }
            }

            data.push([
                `<div class="violationId"
                    data-taskid="${record.ID}"
                    data-violationid="${v.ID}"
                    data-offendertype="${v.OffenderType}"
                    data-violationcode="${v.ViolationCode}"
                    data-casenumber="${v.CaseNumber}"
                    data-violationstatus="${violationStatus}"
                    data-iscancelled="${isCancelled}"
                    data-remainingAmount ="${v?.RemainingAmount}"
                    data-totalprice="${currentAmount}">
                    ${v.ViolationCode || "-"}
                </div>`,

                `<div class="controls">
                    <div class="ellipsisButton">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </div>
                    <div class="hiddenListBox">
                        <div class="arrow"></div>
                            <ul class="list-unstyled controlsList">
                                <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
                                <li><a href="#" class="printPaymentFormOnly">طباعة نموذج السداد</a></li>
                                <li>
                                    <a href="#"
                                    data-violationid="${v?.ID}"
                                    data-violationcode="${v?.ViolationCode}"
                                    class="violationHistory"
                                    data-toggle="modal"
                                    data-target="#trackHistoryModal">
                                        تتبع مرحلة المخالفة
                                    </a>
                                </li>
                                ${actionButtons}
                            </ul>
                    </div>
                </div>`,
                `<div>${functions.getViolationArabicName(v.OffenderType)}</div>`,
                `<div>${functions.getViolationArabicName(v.OffenderType, v?.ViolationTypes?.Title)}</div>`,
                `<div>${v.ViolatorCompany || "-"}</div>`,
                `<div>${v.CaseNumber || "-"}</div>`,
                `<div>${v.AssignedProsecution || "-"}</div>`,
                `<div>${v.ViolationsZone || "-"}</div>`,
                `${ExternalViolationLog.getViolationStatus(violationStatus)}`,
                `${functions.getDisplayValue(v?.TotalPriceDue, true)}`,
                `${functions.getDisplayValue(v.TotalOldPrice, true)}`,
                `${functions.getDisplayValue(violationStatus === "Paid" ? v.TotalPriceDue : v.TotalInstallmentsPaidAmount, true)}`,
                `${functions.getDisplayValue(v?.RemainingAmount, true)}`,
                `${functions.getFormatedDate(v?.InstallmentDate) || "-"}`,
            ]);
        });
    }

    if (ExternalViolationLog.destroyTable || destroyTable) {
        $("#ExternalViolationLog").DataTable().destroy();
    }

    // `${functions.getDisplayValue(violationStatus === "Paid" ? v.TotalPriceDue : v.TotalInstallmentsPaidAmount, true)}`,
    // `${functions.getDisplayValue(violationStatus === "Paid" ? v.TotalPriceDue : TotalInstallment, true)}`,
    // `${functions.getDisplayValue(violationStatus == "Paid" ? 0 : v?.RemainingAmount, true)}`,

    let Table = functions.tableDeclare(
        "#ExternalViolationLog",
        data,
        [
            { title: "رقم المخالفة" },
            { title: "", class: "all" },
            { title: "تصنيف المخالفة" },
            { title: "نوع المخالفة" },
            { title: "إسم الشركة المخالفة" },
            { title: "رقم القضية" },
            { title: "النيابة المختصة" },
            { title: "جهة الضبط" },
            { title: "حالة المخالفة" },
            { title: "المبلغ الحالي" },  // TotalPriceDue
            { title: "المبلغ قبل التعديل" },  // TotalOldPrice
            { title: "المبلغ المسدد" },   // TotalInstallmentsPaidAmount
            { title: "المبلغ المتبقي" },  // RemainingAmount
            { title: "تاريخ أخر تسديد" }, // InstallmentDate
        ],
        false,
        false,
        "سجل المخالفات الخارجية.xlsx",
        "سجل المخالفات الخارجية"
    );

    // 🔹 create column selector
    functions.createColumnSelector(Table, "#columnSelector", 'green');
    ExternalViolationLog.destroyTable = true;

    // Update export button handler
    $("#exportBtn").off("click").on("click", () => {
        ExternalViolationLog.exportToExcel();
    });

    let violationlog = Table.rows().nodes().to$();
    let UserId = _spPageContextInfo.userId;
    functions.callSharePointListApi("Configurations").then((Users) => {
        let UserDetails = null;
        let UsersData = Users.value;
        UsersData.forEach((User) => {
            if (User.UserIdId.find((id) => id == UserId)) {
                UserDetails = User;
            }
        });

        $.each(violationlog, (index, record) => {
            let jQueryRecord = $(record);
            let taskID = jQueryRecord.find(".violationId").data("taskid");
            let violationID = jQueryRecord.find(".violationId").data("violationid");
            let violationCode = jQueryRecord.find(".violationId").data("violationcode");
            let hiddenListBox = jQueryRecord
                .find(".controls")
                .children(".hiddenListBox");

            // Toggle menu
            jQueryRecord.find(".controls").children(".ellipsisButton").on("click", (e) => {
                e.stopPropagation();
                const currentBox = $(e.currentTarget).siblings(".hiddenListBox");
                $(".hiddenListBox").not(currentBox).stop(true, true).hide(300);
                currentBox.stop(true, true).toggle(300);
            });

            // Item Details
            jQueryRecord
                .find(".controls")
                .children(".hiddenListBox")
                .find(".itemDetails")
                .on("click", (e) => {
                    $(".overlay").addClass("active");
                    ExternalViolationLog.findViolationByID(
                        e,
                        taskID,
                        false
                    );
                });

            // full payment
            jQueryRecord
                .find(".controls")
                .children(".hiddenListBox")
                .find(".payViolation")
                .on("click", (e) => {
                    $(".overlay").addClass("active");
                    ExternalViolationLog.findViolationByID(e, taskID, "PaymentForm");
                });

            // Pay Installment
            jQueryRecord
                .find(".controls")
                .children(".hiddenListBox")
                .find(".payInstallment")
                .on("click", (e) => {
                    $(".overlay").addClass("active");
                    ExternalViolationLog.getViolationDetailsForPayment(taskID);
                });

            // Print payment form only
            jQueryRecord.find(".controls").children(".hiddenListBox").find(".printPaymentFormOnly").off("click").on("click", (e) => {
                $(".overlay").addClass("active");
                ExternalViolationLog.printPaymentFormOnly(e, taskID);
            });

            // Edit Violation Amount Action
            jQueryRecord
                .find(".controls")
                .children(".hiddenListBox")
                .find(".editViolationAmountAction")
                .on("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    let currentAmount = jQueryRecord.find(".violationId").data("totalprice");
                    let caseNumber = jQueryRecord.find(".violationId").data("casenumber");

                    ExternalViolationLog.editExternalViolationAmountPopup(
                        taskID,
                        violationID,
                        violationCode,
                        caseNumber,
                        currentAmount
                    );

                    $(".hiddenListBox").hide(300);
                });

            // Save case action
            jQueryRecord
                .find(".controls")
                .children(".hiddenListBox")
                .find(".saveExternalCaseAction")
                .on("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    let caseNumber = jQueryRecord.find(".violationId").data("casenumber");

                    $(".hiddenListBox").hide(300);
                    ExternalViolationLog.saveCaseAndCancelViolationPopup(
                        taskID,
                        violationID,
                        violationCode,
                        caseNumber
                    );
                });
        });
    });

    functions.hideTargetElement(".controls", ".hiddenListBox");
};

ExternalViolationLog.exportToExcel = () => {
    const currentFilters = {
        RowsPerPage: 10000000, // Get all records for export
        PageIndex: 1,
        ColName: "created",
        SortOrder: "desc",
        IsExternalRecord: true,
        CaseNumber: $("#caseNumber").val(),
        ViolationCode: $("#violationCode").val(),
        CreatedFrom: $("#createdFrom").val()
            ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
            : null,
        CreatedTo: $("#createdTo").val()
            ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
            : null,
    };

    // Define columns with their data mapping
    const columns = [
        {
            title: "رقم المخالفة",
            data: "Violation.ViolationCode",
        },
        {
            title: "",
            skip: true
        },
        {
            title: "تصنيف المخالفة",
            render: (record) => functions.getViolationArabicName(record.Violation?.OffenderType),
        },
        {
            title: "نوع المخالفة",
            render: (record) => functions.getViolationArabicName(
                record.Violation?.OffenderType,
                record.Violation?.ViolationTypes?.Title
            ),
        },
        {
            title: "إسم الشركة المخالفة",
            data: "Violation.ViolatorCompany",
        },
        {
            title: "رقم القضية",
            data: "Violation.CaseNumber",
        },
        {
            title: "النيابة المختصة",
            data: "Violation.AssignedProsecution",
        },
        {
            title: "جهة الضبط",
            data: "Violation.Governrates.Title",
        },
        {
            title: "حالة المخالفة",
            render: (record) => {
                const status = record.Status || record.StatusAr || "";
                return getViolationStatusText(status);
            },
        },
        {
            title: "المبلغ الإجمالي",
            render: (record) => functions.getDisplayValue(record.Violation?.TotalPriceDue, true),
        },
        {
            title: "المبلغ المسدد",
            render: (record) => functions.getDisplayValue(record.Violation?.TotalInstallmentsPaidAmount, true),
        },
        {
            title: "المبلغ المتبقي",
            render: (record) => functions.getDisplayValue(record.Violation?.RemainingAmount, true),
        },
        {
            title: "تاريخ أخر تسديد",
            render: (record) => functions.getFormatedDate(record.Violation?.InstallmentDate),
        },
        {
            title: "الإحداثيات",
            exportOnly: true,
            render: (record) => {
                const violation = record.Violation;
                if (!violation) return "-";

                // Try to get coordinates in degrees format first, fallback to regular format
                const coordinatesDegrees = violation.CoordinatesDegrees;
                const coordinates = violation.Coordinates;

                if (coordinatesDegrees) {
                    // Parse the coordinates array and format them nicely
                    try {
                        const coordsArray = JSON.parse(coordinatesDegrees);
                        if (Array.isArray(coordsArray) && coordsArray.length > 0) {
                            return coordsArray.join(" | ");
                        }
                        return coordinatesDegrees;
                    } catch (e) {
                        return coordinatesDegrees;
                    }
                }

                if (coordinates) {
                    try {
                        const coordsArray = JSON.parse(coordinates);
                        if (Array.isArray(coordsArray) && coordsArray.length > 0) {
                            return coordsArray.join(" | ");
                        }
                        return coordinates;
                    } catch (e) {
                        return coordinates;
                    }
                }

                return "-";
            },
        },
    ];

    functions.exportFromAPI({
        searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
        requestData: { Data: currentFilters },
        columns: columns,
        fileName: "سجل المخالفات الخارجية.xlsx",
        sheetName: "سجل المخالفات الخارجية",
        columnWidths: 25,
        rtl: true,
        dataPath: "d.Result.GridData",
        exportButtonSelector: "#exportBtn",
        tableSelector: "#ExternalViolationLog"
    });
};

// Helper function to get violation status text in Arabic
function getViolationStatusText(status) {
    const statusMap = {
        "Pending": "قيد الانتظار",
        "Confirmed": "قيد الانتظار",
        "Exceeded": "تجاوز مدة السداد",
        "Saved": "محفوظة",
        "Paid After Reffered": "سداد بعد الإحالة",
        "Paid": "تم السداد",
        "UnderPayment": "قيد السداد",
        "Approved": "تم الموافقة",
        "Rejected": "مرفوضة",
        "Reffered": "تم الإحالة",
        "UnderReview": "منظورة",
        "ExternalReviewed": "منظورة",
        "Completed": "مكتملة",
        "Cancelled": "محفوظة"
    };

    return statusMap[status] || status || '-';
}

// ExternalViolationLog.bindTableEvents = (table) => {
//     $(document)
//         .off("click", ".ellipsisButton")
//         .on("click", ".ellipsisButton", function () {
//             $(".hiddenListBox").hide(200);
//             $(this).siblings(".hiddenListBox").toggle(200);
//         });

//     $(document)
//         .off("click", ".itemDetails")
//         .on("click", ".itemDetails", function (e) {
//             e.preventDefault();
//             let taskID = $(this)
//                 .closest("tr")
//                 .find(".violationId")
//                 .data("taskid");

//             $(".overlay").addClass("active");
//             ExternalViolationLog.findViolationByID(taskID);
//         });

//     functions.hideTargetElement(".controls", ".hiddenListBox");
// };

ExternalViolationLog.findViolationByID = (event, taskID, popupType = "", print = false) => {
    let request = {
        Id: taskID,
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            let violationData;
            let violationOffenderType;
            let Content;
            let printBox;
            let violationID;
            let TaskData;
            let paymentForm;
            let ExDate;
            let PrintedCount;

            if (data != null) {
                TaskData = data.d;
                violationData = data.d.Violation;
                violationID = data.d.ViolationId;
                violationOffenderType = violationData.OffenderType;
                ExDate = functions.getFormatedDate(TaskData.ReconciliationExpiredDate);
                PrintedCount = TaskData.PrintedCount;

                if (violationOffenderType == "Quarry") {
                    if (popupType == "PaymentForm") {
                        $(".overlay").removeClass("active");
                        Content = DetailsPopup.quarryDetailsPopupContent(
                            violationData,
                            "منظورة خارجياً"
                        );
                        paymentForm = ExternalViolationLog.paymentFormHtml(TaskData);
                        Content += paymentForm;
                        printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                        functions.declarePopup(
                            ["generalPopupStyle", "detailsPopup"],
                            printBox
                        );
                    } else if (popupType == "PaymentFormPrint") {
                        $(".overlay").removeClass("active");
                        Content = DetailsPopup.printPaymentForm(TaskData);
                        functions.declarePopup(
                            ["generalPopupStyle", "paymentFormDetailsPopup"],
                            Content
                        );
                    } else {
                        Content = DetailsPopup.quarryDetailsPopupContent(
                            violationData,
                            "منظورة خارجياً"
                        );
                        printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                        functions.declarePopup(
                            ["generalPopupStyle", "detailsPopup"],
                            printBox
                        );
                    }
                } else if (violationOffenderType == "Vehicle") {
                    let VehcleType = violationData.VehicleType;
                    if (popupType == "PaymentForm") {
                        $(".overlay").removeClass("active");
                        Content = DetailsPopup.vehicleDetailsPopupContent(
                            violationData,
                            "منظورة خارجياً"
                        );
                        paymentForm = ExternalViolationLog.paymentFormHtml(TaskData);
                        Content += paymentForm;
                        printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                        functions.declarePopup(
                            ["generalPopupStyle", "detailsPopup"],
                            printBox
                        );
                    } else if (popupType == "PaymentFormPrint") {
                        $(".overlay").removeClass("active");
                        Content = DetailsPopup.printPaymentForm(TaskData);
                        functions.declarePopup(
                            ["generalPopupStyle", "paymentFormDetailsPopup"],
                            Content
                        );
                    } else {
                        Content = DetailsPopup.vehicleDetailsPopupContent(
                            violationData,
                            "منظورة خارجياً"
                        );
                        printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                        functions.declarePopup(
                            ["generalPopupStyle", "detailsPopup"],
                            printBox
                        );
                    }
                    if (VehcleType == "عربة بمقطورة") {
                        $(".TrailerNumberBox").show();
                    } else {
                        $(".TrailerNumberBox").hide();
                    }
                } else if (violationOffenderType == "Equipment") {
                    if (popupType == "PaymentForm") {
                        $(".overlay").removeClass("active");
                        Content = DetailsPopup.equipmentDetailsPopupContent(
                            violationData,
                            "منظورة خارجياً"
                        );
                        paymentForm = ExternalViolationLog.paymentFormHtml(TaskData);
                        Content += paymentForm;
                        printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                        functions.declarePopup(
                            ["generalPopupStyle", "detailsPopup"],
                            printBox
                        );
                    } else if (popupType == "PaymentFormPrint") {
                        $(".overlay").removeClass("active");
                        Content = DetailsPopup.printPaymentForm(TaskData);
                        functions.declarePopup(
                            ["generalPopupStyle", "paymentFormDetailsPopup"],
                            Content
                        );
                    } else {
                        Content = DetailsPopup.equipmentDetailsPopupContent(
                            violationData,
                            "منظورة خارجياً"
                        );
                        printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                        functions.declarePopup(
                            ["generalPopupStyle", "detailsPopup"],
                            printBox
                        );
                    }
                }

                // FIX: Hide buttons AFTER rendering
                setTimeout(() => {
                    const popup = $(".detailsPopupForm");
                    popup.find("#editMaterialMinPrice, #payAllPrice")
                        .css("display", "none")
                        .attr("style", "display: none !important");
                }, 50);

                // Hide edit button (extra safety)
                $("#editMaterialMinPrice").hide();

                // Add class to identify this popup
                $(".popupForm").addClass("Externalform");

                // Show payment form actions if payment form is displayed
                if (popupType == "PaymentForm") {
                    ExternalViolationLog.paymentFormActions();
                }

                // Permission-based button visibility
                ExternalViolationLog.popupPermissionShowTypes(popupType, taskID, ExDate);

                // Hide/show appropriate sections based on context
                if (popupType != "PaymentForm") {
                    $(".totalPriceBox").show().find(".dateLimitBox").hide();
                    $(".confirmationAttachBox").show();
                    $(".Externalform").find(".addConfirmationAttchBox").hide();
                    $(".Externalform").find(".rejectReasonBox").hide();
                    $(".Externalform").find(".showFormula").hide();
                }

                // Handle print functionality
                $(".printBtn").on("click", (e) => {
                    functions.PrintDetails(e);
                });

                if (print) {
                    $(".Externalform").find(".confirmationAttachBox").show();
                    functions.PrintDetails(event);
                }

                $(".printConfirmationForm").hide();
                $(".printPaymentForm").on("click", (e) => {
                    functions.PrintDetails(e);
                });
                $(".printPaymentFormBtn").on("click", (e) => {
                    ExternalViolationLog.setExpirationDate(
                        taskID,
                        PrintedCount,
                        violationOffenderType,
                    );
                    functions.PrintDetails(e);
                });

                $(".detailsPopupForm").addClass("externalTasks");

                // Get attachments if needed
                if (popupType != "PaymentForm") {
                    DetailsPopup.getConfirmationAttachments(taskID);
                }
            } else {
                violationData = null;
            }
        })
        .catch((err) => {
            console.log(err);
        });
};

///////////// save case and cancel popup /////////////
ExternalViolationLog.saveCaseAndCancelViolationPopup = (
    TaskID,
    ViolationID,
    violationCode,
    caseNumber
) => {
    $(".overlay").removeClass("active");

    let title = violationCode
        ? `حفظ القضية وإلغاء المخالفة - المخالفة رقم (${violationCode})`
        : `حفظ القضية وإلغاء المخالفة`;

    let popupHtml = `
        <div class="popupHeader" style="display: flex; justify-content: space-between;">
            <div class="violationsCode"> 
                <p>${title}</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeSaveCasePopup" id="closeSaveCasePopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="form-group customFormGroup">
                                        <label for="saveCaseComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea saveCaseComments" id="saveCaseComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="saveCaseAttachment" class="customLabel">إرفاق المستندات <span style="color: red;">*</span></label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput saveCaseAttachment form-control" id="saveCaseAttachment" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox">
                                <div class="btnStyle confirmBtnGreen popupBtn confirmSaveCaseBtn" id="confirmSaveCaseBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn closeSaveCasePopupFooter" id="closeSaveCasePopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup"],
        popupHtml
    );

    // Add close button handlers
    $("#closeSaveCasePopup, #closeSaveCasePopupFooter").on("click", function () {
        functions.closePopup();
    });

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let SaveCaseCommentsInput = "";

    // Handle comments input
    $("#saveCaseComments").on("input", (e) => {
        SaveCaseCommentsInput = $(e.currentTarget).val().trim();
    });

    // File attachment handling
    $("#saveCaseAttachment").on("change", (e) => {
        allAttachments = $(e.currentTarget)[0].files;
        if (allAttachments.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < allAttachments.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${allAttachments[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }

        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < allAttachments.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(allAttachments[i]);
                }
            }
            allAttachments = fileBuffer.files;
            countOfFiles = allAttachments.length;
            if (countOfFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });

        for (let i = 0; i < allAttachments.length; i++) {
            let fileSplited = allAttachments[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    // Confirm Save Case button handler
    $("#confirmSaveCaseBtn").on("click", (e) => {
        if (allAttachments != null && allAttachments.length > 0) {
            $(".overlay").addClass("active");

            // First cancel the violation task (set status to "Cancelled")
            ExternalViolationLog.cancelTaskAndUploadAttachment(
                TaskID,
                ViolationID,
                SaveCaseCommentsInput,
                "#saveCaseAttachment"
            );
        } else {
            functions.warningAlert("من فضلك قم بإرفاق المستندات المطلوبة");
        }
    });
};
ExternalViolationLog.cancelTaskAndUploadAttachment = (
    TaskID,
    ViolationID,
    Comments,
    attachInput
) => {
    // Step 1: Cancel the task by updating its status to "Cancelled"
    let cancelTaskRequest = {
        request: {
            Data: {
                ID: TaskID,
                ViolationId: ViolationID,
                Status: "Cancelled",
                Comment: Comments
            }
        }
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save",
            cancelTaskRequest
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d && data.d.Status) {
                // Step 2: Upload attachment to Violations list (ViolationsCycle)
                ExternalViolationLog.uploadSaveCaseAttachmentToViolation(
                    ViolationID,
                    attachInput,
                    Comments
                );
            } else {
                $(".overlay").removeClass("active");
                functions.warningAlert("حدث خطأ أثناء حفظ القضية");
            }
        })
        .catch((err) => {
            console.error("Error canceling task:", err);
            $(".overlay").removeClass("active");
            functions.warningAlert("حدث خطأ أثناء حفظ القضية");
        });
};
ExternalViolationLog.uploadSaveCaseAttachmentToViolation = (
    ViolationID,
    attachInput,
    Comments
) => {
    let Data = new FormData();
    Data.append("itemId", ViolationID);
    Data.append("listName", "Violations"); // Upload to Violations list

    let filesInput = $(attachInput)[0];
    for (let i = 0; i <= filesInput.files.length; i++) {
        Data.append("file" + i, filesInput.files[i]);
    }

    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active");
            functions.sucessAlert("تم إلغاء المخالفة بنجاح");
            functions.closePopup();
        },
        error: (err) => {
            $(".overlay").removeClass("active");
            functions.warningAlert("تم إلغاء المخالفة ولكن حدث خطأ في رفع المرفقات");
            console.log(err.responseText);
        },
    });
};
/////////////////////////////////////////
ExternalViolationLog.editExternalViolationAmountPopup = (
    TaskID,
    ViolationID,
    violationCode,
    caseNumber,
    currentAmount
) => {
    $(".overlay").removeClass("active");

    let popupTitle = violationCode
        ? `تعديل مبلغ السداد - المخالفة رقم (${violationCode})`
        : `تعديل مبلغ السداد`;

    let popupHtml = `
        <div class="popupHeader" style="display: flex; justify-content: space-between;">
            <div class="violationsCode"> 
                <p>${popupTitle}</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeEditAmountPopup" id="closeEditAmountPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="currentAmount" class="customLabel">المبلغ الحالي</label>
                                        <input class="form-control disabled customInput currentAmount" id="currentAmount" type="text" value="${functions.getDisplayValue(currentAmount > 0 ? currentAmount : 0, true)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="newAmount" class="customLabel">المبلغ الجديد</label>
                                        <input class="form-control customInput newAmount" id="newAmount" type="text" placeholder="أدخل المبلغ الجديد">
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="form-group customFormGroup">
                                        <label for="amountComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea amountComments" id="amountComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="editAmountAttach" class="customLabel">إرفاق مستند تعديل المبلغ * </label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput editAmountAttach form-control" id="editAmountAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox">
                                <div class="btnStyle confirmBtnGreen popupBtn confirmEditAmountBtn" id="confirmEditAmountBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn closeEditAmountPopupFooter" id="closeEditAmountPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup"],
        popupHtml
    );

    // Add close button handlers
    $("#closeEditAmountPopup, #closeEditAmountPopupFooter").on("click", function () {
        functions.closePopup();
    });

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let NewAmountInput = "";

    // Store old amount
    let OldAmount = currentAmount > 0 ? currentAmount : 0;

    // File attachment handling
    $("#editAmountAttach").on("change", (e) => {
        allAttachments = $(e.currentTarget)[0].files;
        if (allAttachments.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < allAttachments.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${allAttachments[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }

        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < allAttachments.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(allAttachments[i]);
                }
            }
            allAttachments = fileBuffer.files;
            countOfFiles = allAttachments.length;
            if (countOfFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });

        for (let i = 0; i < allAttachments.length; i++) {
            let fileSplited = allAttachments[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    // Format amount input
    $("#newAmount").on("keypress", (e) => {
        return functions.isDecimalNumberKey(e);
    });

    $("#newAmount").on("input", (e) => {
        let rawValue = $(e.currentTarget).val().replace(/\,/g, "");
        rawValue = rawValue.replace(/[^0-9.]/g, '');
        NewAmountInput = rawValue;

        if (rawValue) {
            let formatted = rawValue.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",");
            $(e.currentTarget).val(formatted);
        }
    });

    // Confirm button handler
    $("#confirmEditAmountBtn").on("click", (e) => {
        let cleanAmount = NewAmountInput.replace(/\,/g, "");

        if (cleanAmount != "" && !isNaN(parseFloat(cleanAmount)) && parseFloat(cleanAmount) > 0) {
            if (allAttachments != null && allAttachments.length > 0) {
                let comments = $("#amountComments").val().trim();

                $(".overlay").addClass("active");

                // Update the task with new amount
                ExternalViolationLog.updateExternalViolationAmount(
                    TaskID,
                    ViolationID,
                    parseFloat(cleanAmount),
                    parseFloat(OldAmount),
                    comments,
                    "#editAmountAttach"
                );
            } else {
                functions.warningAlert("من فضلك قم بإرفاق مستند تعديل المبلغ");
            }
        } else {
            functions.warningAlert("من فضلك قم بإدخال المبلغ الجديد بشكل صحيح");
        }
    });
};
ExternalViolationLog.updateExternalViolationAmount = (
    TaskID,
    ViolationID,
    newAmount,
    oldAmount,
    comments,
    attachInput
) => {
    let request = {
        request: {
            Data: {
                ID: TaskID,
                ViolationId: ViolationID,
                TotalPriceDue: newAmount,
                TotalOldPrice: oldAmount,
                Comment: comments,
                Title: "تم تعديل مبلغ السداد"
            }
        }
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d && data.d.Status) {
                // Upload attachment after successful update
                ExternalViolationLog.uploadAmountEditAttachment(
                    ViolationID,
                    attachInput,
                    "تم تعديل مبلغ السداد بنجاح"
                );
            } else {
                $(".overlay").removeClass("active");
                functions.warningAlert("حدث خطأ أثناء تعديل المبلغ");
            }
        })
        .catch((err) => {
            console.error("Error updating amount:", err);
            $(".overlay").removeClass("active");
            functions.warningAlert("حدث خطأ أثناء تعديل المبلغ");
        });
};
ExternalViolationLog.uploadAmountEditAttachment = (
    ViolationID,
    attachInput,
    successMessage
) => {
    let Data = new FormData();
    Data.append("itemId", ViolationID);
    Data.append("listName", "Violations");

    let filesInput = $(attachInput)[0];
    for (let i = 0; i <= filesInput.files.length; i++) {
        Data.append("file" + i, filesInput.files[i]);
    }

    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active");
            functions.sucessAlert(successMessage);
            functions.closePopup();
        },
        error: (err) => {
            $(".overlay").removeClass("active");
            functions.warningAlert("تم تعديل المبلغ ولكن حدث خطأ في رفع المرفقات");
            console.log(err.responseText);
        },
    });
};
////////////////////////////////
ExternalViolationLog.getViolationStatus = (ViolationStatus) => {
    let statusHtml = ``;
    switch (ViolationStatus) {
        case "Pending":
        case "Confirmed": {
            statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-clock"></i>
                <span class="statusText">قيد الانتظار</span>
            </div>`;
            break;
        }
        case "Exceeded": {
            statusHtml = `<div class="statusBox warningStatus">
                <img class="statusIcon" src="/Style Library/MiningViolations/images/tringleIcon.svg" alt="warning">
                <span class="statusText">تجاوز مدة السداد</span>
            </div>`;
            break;
        }
        case "Saved": {
            statusHtml = `<div class="statusBox killedStatus">
                <i class="statusIcon fa-solid fa-ban"></i> 
                <span class="statusText">محفوظة</span>
            </div>`;
            break;
        }
        case "Paid After Reffered": {
            statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">سداد بعد الإحالة</span>
            </div>`;
            break;
        }
        case "Paid": {
            statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">تم السداد</span>
            </div>`;
            break;
        }
        case "UnderPayment": {
            statusHtml = `<div class="statusBox warningStatus">
                <img class="statusIcon" src="/Style Library/MiningViolations/images/tringleIcon.svg" alt="warning">
                <span class="statusText">قيد السداد</span>
            </div>`;
            break;
        }
        case "Approved": {
            statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">تم الموافقة</span>
            </div>`;
            break;
        }
        case "Rejected": {
            statusHtml = `<div class="statusBox killedStatus">
                <i class="statusIcon fa-solid fa-ban"></i> 
                <span class="statusText">مرفوضة</span>
            </div>`;
            break;
        }
        case "Reffered": {
            statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-paper-plane"></i>
                <span class="statusText">تم الإحالة</span>
            </div>`;
            break;
        }
        case "UnderReview": {
            statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-eye"></i>
                <span class="statusText">منظورة</span>
            </div>`;
            break;
        }
        case "ExternalReviewed": {
            statusHtml = `<div class="statusBox pendingStatus">
                <i class="statusIcon fa-regular fa-eye"></i>
                <span class="statusText">منظورة</span>
            </div>`;
            break;
        }
        case "Completed": {
            statusHtml = `<div class="statusBox closedStatus">
                <i class="statusIcon fa-regular fa-circle-check"></i>
                <span class="statusText">مكتملة</span>
            </div>`;
            break;
        }
        case "Cancelled": {
            statusHtml = `<div class="statusBox killedStatus">
                <i class="statusIcon fa-solid fa-ban"></i> 
                <span class="statusText">محفوظة</span>
            </div>`;
            break;
        }
    }

    return statusHtml;
};
///////////////////////////////////////////////////////////
// full payment
ExternalViolationLog.printPaymentForm = (event, taskID, print = false) => {
    let request = {
        Id: taskID,
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            let TaskData;
            let violationData;
            let violationOffenderType;
            let Content;
            let printBox;

            if (data != null) {
                TaskData = data.d;
                violationData = TaskData.Violation;
                violationOffenderType = violationData.OffenderType;

                if (violationOffenderType == "Quarry") {
                    $(".overlay").removeClass("active");
                    Content = DetailsPopup.printPaymentForm(TaskData);
                    functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
                } else if (violationOffenderType == "Vehicle") {
                    $(".overlay").removeClass("active");
                    Content = DetailsPopup.printPaymentForm(TaskData);
                    functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
                } else if (violationOffenderType == "Equipment") {
                    $(".overlay").removeClass("active");
                    Content = DetailsPopup.printPaymentForm(TaskData);
                    functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);
                }

                // Remove previous handlers before adding new ones
                $(".printBtn").off("click").on("click", (e) => {
                    functions.PrintDetails(e);
                });

                // FIX: Hide buttons AFTER rendering
                setTimeout(() => {
                    const popup = $(".detailsPopupForm");
                    popup.find("#editMaterialMinPrice, #payAllPrice")
                        .css("display", "none")
                        .attr("style", "display: none !important");
                }, 50);

                // $(".printPaymentForm").hide();
                $(".printConfirmationForm").css("display", "flex !important");

                // Remove previous handler before adding new one
                $(".printConfirmationForm").off("click").on("click", (e) => {
                    functions.PrintDetails(e);
                });

            }
        })
        .catch((err) => {
            console.log(err);
        });
};
ExternalViolationLog.printPaymentFormOnly = (event, taskID) => {
    let request = {
        Id: taskID,
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            let TaskData;
            let Content;

            if (data != null) {
                TaskData = data.d;

                $(".overlay").removeClass("active");
                Content = DetailsPopup.printConfirmationFormOnly(TaskData);
                functions.declarePopup(["generalPopupStyle", "paymentFormDetailsPopup"], Content);

                // Add print and close button handlers
                setTimeout(() => {
                    // Remove previous handlers before adding new ones
                    $(".printPaymentFormBtn").off("click").on("click", (e) => {
                        const lowerSection = $(".violationDetailsBody").closest(".popupSectionWrapper");
                        if (lowerSection.length) {
                            lowerSection.hide();
                        }
                        functions.PrintDetails(e);
                        setTimeout(() => {
                            if (lowerSection.length) {
                                lowerSection.show();
                            }
                        }, 1000);
                    });

                    $(".closePrintPaymentDetailsPopup").off("click").on("click", () => {
                        functions.closePopup();
                    });
                }, 100);
            }
        })
        .catch((err) => {
            console.log(err);
        });
};

ExternalViolationLog.setExpirationDate = (
    TaskId,
    PrintedCount,
    violationOffenderType,
) => {
    // $(".modal:last-child").attr("aria-label","Close")
    // $(".modal:last-child").attr("data-dismiss","modal")
    let request = {};
    let ExpirationDate;

    if (PrintedCount == 0) {
        if (violationOffenderType == "Quarry") {
            ExpirationDate = functions.getNDaysAfterCurrentDate(30);
        } else if (violationOffenderType == "Vehicle") {
            ExpirationDate = functions.getNDaysAfterCurrentDate(15);
        } else if (violationOffenderType == "Equipment") {
            ExpirationDate = functions.getNDaysAfterCurrentDate(30);
        }
        request = {
            Data: {
                ID: TaskId,
                PrintedCount: 1,
                ReconciliationExpiredDate: ExpirationDate,
            },
        };
    } else {
        PrintedCount += 1;
        request = {
            Data: {
                ID: TaskId,
                PrintedCount: PrintedCount,
            },
        };
    }

    ExternalViolationLog.setExpirationDateAPI(request);
};
ExternalViolationLog.setExpirationDateAPI = (request) => {
    functions
        .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", {
            request,
        })
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => { })
        .catch((err) => { });
};

ExternalViolationLog.popupPermissionShowTypes = (popupType, TaskId, ExDate) => {
    if (popupType == "Details") {
        $(".totalPriceBox")
            .show()
            .find(".violationEndTime")
            .val(ExDate == "01-01-2001" ? "-" : ExDate);
        $(".confirmationAttachBox").show();
        DetailsPopup.getConfirmationAttachments(TaskId);
    }
    // else if(popupType == "PaymentFormPrint"){
    //     $(".totalPriceBox").show().find(".violationEndTime").val(ExDate)
    //     $(".printPaymentForm").css("display","flex")
    // }
    else if (popupType == "PaymentForm") {
        $(".hiddenDetailsBox").addClass("showHiddenDetailsBox");
        $(".totalPriceBox")
            .show()
            .find(".violationEndTime")
            .val(ExDate == "01-01-2001" ? "-" : ExDate);
        $(".popupFormBoxHeader").show();
        $(".confirmationAttachBox").show();
        DetailsPopup.getConfirmationAttachments(TaskId);
        $(".detailsPopupForm").find(".formButtonsBox").hide();
        $(".hiddenDetailsBox").hide();
        $(".showMoreDetails").css("display", "flex");
        $(".showMoreDetails").on("click", (e) => {
            $(".hiddenDetailsBox").slideToggle();
            $(".showMoreDetails").find("img").toggleClass("rotateDetailsIcon");
            $(".showMoreDetails")
                .find("p")
                .text(
                    $(".showMoreDetails").find("p").text() == "إظهار المزيد من التفاصيل"
                        ? "إخفاء التفاصيل"
                        : "إظهار المزيد من التفاصيل",
                );
        });
    }
};

ExternalViolationLog.paymentFormHtml = (TaskData) => {
    let offenderType = TaskData.Violation.OffenderType;
    let violationPriceType =
        TaskData.Violation.ViolationTypes != null
            ? TaskData.Violation.ViolationTypes.PriceType
            : "";
    let TotalViolationPrice = TaskData.Violation.TotalPriceDue;
    let RoyaltyPrice = TaskData.Violation.LawRoyalty;
    let QuarryMaterialValue = TaskData.Violation.QuarryMaterialValue;
    // let FinesValue = TaskData.Violation.TotalPriceDue;
    let violationTypeLastPrice;
    let labelText;
    let inputVal;
    if (offenderType == "Quarry") {
        violationTypeLastPrice = DetailsPopup.getQuarryViolationValueByType(
            violationPriceType,
            TotalViolationPrice,
            QuarryMaterialValue,
        );
        labelText = violationTypeLastPrice.labelText;
        inputVal = violationTypeLastPrice.InputVal;
    } else {
        violationTypeLastPrice = DetailsPopup.getVechileViolationValueByType(
            TotalViolationPrice,
            RoyaltyPrice,
        );
        labelText = violationTypeLastPrice.labelText;
        inputVal = violationTypeLastPrice.InputVal;
    }


    let quarryPriceInDetails = `
        <div class="col-md-4 violationPriceBox">
            <div class="form-group customFormGroup">
                <label for="quarryPrice" class="customLabel">${labelText}</label>
                <input class="form-control customInput quarryPrice disabledInput" id="quarryPrice" type="text" value="${functions.getDisplayValue(inputVal, true)}" disabled>
            </div>
        </div>
        <div class="col-md-4 royaltyPriceBox">
            <div class="form-group customFormGroup">
                <label for="royaltyPrice" class="customLabel">قيمة الإتاوة</label>
                <input class="form-control customInput royaltyPrice disabledInput" id="royaltyPrice" type="text" value="${functions.getDisplayValue(TaskData?.Violation?.LawRoyalty, true)}" disabled>
            </div>
        </div>
        <div class="col-md-4 equipmentsPriceBox">
            <div class="form-group customFormGroup">
                <label for="equipmentsPrice" class="customLabel">غرامة المعدات</label>
                <input class="form-control customInput equipmentsPrice disabledInput" id="equipmentsPrice" type="text" value="${functions.getDisplayValue(TaskData?.Violation?.TotalEquipmentsPrice, true)}" disabled>
            </div>
        </div>
    `;


    let vehiclePriceInDetails = `
        <div class="col-md-6">
            <div class="form-group customFormGroup">
                <label for="quarryPrice" class="customLabel">${labelText}</label>
                <input class="form-control customInput quarryPrice disabledInput" id="quarryPrice" type="text" value="${functions.getDisplayValue(inputVal, true)}" disabled>
            </div>
        </div>
        <div class="col-md-6">
            <div class="form-group customFormGroup">
                <label for="royaltyPrice" class="customLabel">قيمة الإتاوة</label>
                <input class="form-control customInput royaltyPrice disabledInput" id="royaltyPrice" type="text" value="${functions.getDisplayValue(TaskData?.Violation?.LawRoyalty, true)}" disabled>
            </div>
    </div>
    `;


    let equipmentsPriceInDetails = `
    <div class="col-md-12 equipmentsPriceBox">
        <div class="form-group customFormGroup">
            <label for="equipmentsPrice" class="customLabel">غرامة المعدات</label>
            <input
                class="form-control customInput equipmentsPrice disabledInput"
                id="equipmentsPrice"
                type="text"
                value="${functions.getDisplayValue(TaskData?.Violation?.TotalEquipmentsPrice, true)}"
                disabled
            >
        </div>
    </div>
`;

    let paymentFormHtml = `
        <div class="paymentFormBody">
            <div class="popupForm paymentForm" id="paymentForm" 
                    data-taskid="${TaskData.ID}" 
                    data-violationid="${TaskData.ViolationId}" 
                    data-actualprice="${TaskData.Violation.ActualAmountPaid}" 
                    data-lawroyalty="${TaskData.Violation.LawRoyalty}" 
                    data-totalequipmentsprice="${TaskData.Violation.TotalEquipmentsPrice}" 
                    data-totalprice="${TaskData.Violation.TotalPriceDue}" 
                    data-offendertype="${TaskData.Violation.OffenderType}" 
                    data-violationpricetype="${offenderType == "Quarry" ? TaskData.Violation.ViolationTypes.PriceType : 0}" 
                    data-totalinstallmentspaidamount="${TaskData?.Violation?.TotalInstallmentsPaidAmount || 0}">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                ${offenderType == "Quarry"
            ? quarryPriceInDetails
            : offenderType == "Vehicle"
                ? vehiclePriceInDetails
                : offenderType == "Equipment"
                    ? equipmentsPriceInDetails
                    : ""
        }
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="totalPrice" class="customLabel">المبلغ المطلوب تسديده كامل</label>
                                        <input class="form-control customInput totalPrice disabledInput" id="totalPrice" type="text" 
                                              value="${functions.getDisplayValue(TaskData?.Violation?.TotalPriceDue, true)}" disabled>
                                    </div>
                                    <div class="form-group customFormGroup">
                                        <label for="reconciliationPeriod" class="customLabel">تاريخ نهاية مدة التصالح</label>
                                        <div class="inputIconBox">
                                        <input
                                          class="form-control customInput reconciliationPeriod disabledInput"
                                          id="reconciliationPeriod"
                                          type="text"
                                          value="${functions.getFormatedDateInPayment(TaskData?.ReconciliationExpiredDate)}"
                                          disabled
                                        >
                                            <i class="fa-solid fa-calendar-days"></i>
                                        </div>
                                    </div>


                                    <!----------------------------- المبلغ المتبقي -->
                                    <div class="form-group customFormGroup actualRemainigPriceBox">
                                      <label class="customLabel">المبلغ المتبقي</label>
                                      <input
                                        class="form-control customInput disabledInput remainingAmount"
                                        type="text"
                                        value="${functions.getDisplayValue(TaskData?.Violation?.RemainingAmount, true)}"
                                        disabled
                                      />
                                    </div>

                                    <div class="form-group customFormGroup">
                                        <div class="feildInfoBox">
                                            <label for="payedPrice" class="customLabel">المبلغ المراد تسديده *</label>
                                            <span class="metaDataSpan">بالجنيه المصري</span>
                                        </div>
                                        <input class="form-control customInput payedPrice greenCustomInput" id="payedPrice" type="text" placeholder="ادخل المبلغ المراد تسديده">
                                    </div>

                                    <!---------------------  سداد بالتقسيط-->
                                    <div class="form-group customFormGroup installmentBox">
                                      <label class="checkboxLabel">
                                        <input
                                          type="checkbox"
                                          class="installmentCheckbox"
                                          ${TaskData?.Violation?.IsInstallment ? "checked disabled" : ""}
                                        />
                                        سداد بالتقسيط
                                      </label>
                                    </div>

                                </div>

                                <div class="col-md-6">
                                  ${offenderType != "Equipment"
            ? `
                                    <div class="form-group customFormGroup payQuarryAttachBox">
                                        <label for="attachQuarryPaymentReceipt" class="customLabel">إرفاق إيصال غرامة القيمة المحجرية * </label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <input type="file" class="customInput attachFilesInput attachQuarryPaymentReceipt form-control" id="attachQuarryPaymentReceipt" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx">
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                    <div class="form-group customFormGroup payRoyaltyAttachBox">
                                        <label for="attachLawRoyaltyPaymentReceipt" class="customLabel">إرفاق إيصال الإتاوة * </label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <input type="file" class="customInput attachFilesInput attachLawRoyaltyPaymentReceipt form-control" id="attachLawRoyaltyPaymentReceipt" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx">
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                    `
            : ""
        }
                                    
                                    <div class="form-group customFormGroup payEquipmentsAttachBox" 
                                          style="display:${offenderType == "Quarry" || offenderType == "Equipment" ? "block !important" : "none !important"}">
                                        <label for="attachEquipmentsPaymentReceipt" class="customLabel">إرفاق إيصال غرامة المعدات * </label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <input type="file" class="customInput attachFilesInput attachEquipmentsPaymentReceipt form-control" id="attachEquipmentsPaymentReceipt" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx">
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox ">
                                <div class="btnStyle confirmBtnGreen popupBtn payInstallment" style="display:none">
                                  سداد بالتقسيط
                                </div>

                                <div class="btnStyle confirmBtnGreen popupBtn payAllPrice">
                                  تسديد وإنهاء المخالفة
                                </div>                                
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    `;
    return paymentFormHtml;
};

ExternalViolationLog.payRequest = (
    TaskId,
    request,
    PaymentType,
    offenderType,
) => {
    // Store the request data in the form element
    $(".paymentForm").data("lastRequest", request);

    functions
        .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", {
            request,
        })
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            ExternalViolationLog.uploadPaymentReceiptsAttachment(
                TaskId,
                "ViolationsCycle",
                offenderType,
            );
        })
        .catch((err) => { });
};

ExternalViolationLog.uploadPaymentReceiptsAttachment = (
    TaskId,
    ListName,
    offenderType,
) => {
    let Data = new FormData();
    Data.append("itemId", TaskId);
    Data.append("listName", ListName);
    let count = 0;
    let count2 = 0;

    if (offenderType !== "Equipment") {
        let i;
        for (i = 0; i < $("#attachQuarryPaymentReceipt")[0].files.length; i++) {
            Data.append("file" + i, $("#attachQuarryPaymentReceipt")[0].files[i]);
        }
        let j;
        for (
            j = i;
            count < $("#attachLawRoyaltyPaymentReceipt")[0].files.length;
            j++
        ) {
            Data.append(
                "file" + j,
                $("#attachLawRoyaltyPaymentReceipt")[0].files[count],
            );
            count++;
        }
        for (
            let k = j;
            count2 < $("#attachEquipmentsPaymentReceipt")[0].files.length;
            j++
        ) {
            Data.append(
                "file" + j,
                $("#attachEquipmentsPaymentReceipt")[0].files[count2],
            );
            count2++;
        }
    } else {
        Data.append(
            "file" + 0,
            $("#attachEquipmentsPaymentReceipt")[0].files[count2],
        );
    }

    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active");

            // Get the status from the request that was stored in the form
            let requestData = $(".paymentForm").data("lastRequest") || {};
            let status = requestData?.Data?.Status || "Paid";
            let isInstallment = requestData?.Data?.Violation?.IsInstallment || false;

            if (status === "UnderPayment") {
                functions.sucessAlert("تم تسديد القسط بنجاح");
            } else if (status === "Paid") {
                if (isInstallment) {
                    functions.sucessAlert("تم سداد آخر قسط وإنهاء المخالفة");
                } else {
                    functions.sucessAlert("تم سداد المبلغ بالكامل وإنهاء المخالفة");
                }
            }
        },
        error: (err) => {
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
            $(".overlay").removeClass("active");
        },
    });
};
ExternalViolationLog.paymentFormActions = () => {
    let request = {};
    let violtionPriceType = $(".paymentForm").data("violationpricetype");
    let offenderType = $(".paymentForm").data("offendertype");
    let lawRoyalty = Number($(".paymentForm").data("lawroyalty") || 0);
    let totalEquipmentsPrice = Number($(".paymentForm").data("totalequipmentsprice") || 0);
    let taskId = $(".paymentForm").data("taskid");
    let violationId = $(".paymentForm").data("violationid");
    let TotalPrice = Number($(".paymentForm").data("totalprice"));
    let remainingAmount = Number($(".remainingAmount").val()?.replace(/,/g, "") || 0);
    let totalInstallmentsPaidAmount = Number($(".paymentForm").data("totalinstallmentspaidamount") || 0);
    let paymentDurationMonths = 2;
    let payedPrice = 0;
    let PositiveDecimalNumbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx",
    ];

    $(".dropFilesArea").hide();

    // FILE STORAGE
    let paymentQuarryReceipt = null;
    let paymentRoyaltyReceipt = null;
    let paymentEquipmentsReceipt = null;

    // HELPERS
    function hasRoyaltyReceipt() {
        return paymentRoyaltyReceipt && paymentRoyaltyReceipt.length > 0;
    }

    function hasQuarryReceipt() {
        return paymentQuarryReceipt && paymentQuarryReceipt.length > 0;
    }

    function hasEquipmentsReceipt() {
        return paymentEquipmentsReceipt && paymentEquipmentsReceipt.length > 0;
    }

    // VALIDATIONS
    function validateRoyaltyReceiptRequired() {
        let isVisible = $(".payRoyaltyAttachBox").is(":visible");
        if (isVisible && !hasRoyaltyReceipt()) {
            functions.warningAlert("من فضلك قم بإرفاق إيصال الإتاوة");
            return false;
        }
        return true;
    }

    function validateEquipmentReceiptRequired() {
        let isEquipmentVisible = $(".payEquipmentsAttachBox").is(":visible");
        if (isEquipmentVisible && !hasEquipmentsReceipt()) {
            functions.warningAlert("من فضلك قم بإرفاق إيصال غرامة المعدات");
            return false;
        }
        return true;
    }

    function validateQuarryReceiptRequired() {
        if (!hasQuarryReceipt()) {
            functions.warningAlert(
                "من فضلك قم بإرفاق إيصال غرامة المخالفة المحددة أو غرامة القيمة المحجرية"
            );
            return false;
        }
        return true;
    }

    function validateAllAttachments() {
        if (offenderType === "Equipment") {
            if (!validateEquipmentReceiptRequired()) return false;
            return true;
        }
        if (!validateQuarryReceiptRequired()) return false;
        if (!validateRoyaltyReceiptRequired()) return false;
        if (!validateEquipmentReceiptRequired()) return false;
        return true;
    }

    // UI TOGGLE
    if ($(".installmentCheckbox").is(":checked")) {
        $(".payAllPrice").hide();
        $(".payInstallment").show();
    } else {
        $(".payAllPrice").show();
        $(".payInstallment").hide();
    }

    $(".installmentCheckbox").on("change", function () {
        if ($(this).is(":checked")) {
            $(".payAllPrice").hide();
            $(".payInstallment").show();
        } else {
            $(".payInstallment").hide();
            $(".payAllPrice").show();
        }
    });

    // UI RULES
    if (offenderType === "Equipment") {
        $(".payQuarryAttachBox").hide();
        $(".payRoyaltyAttachBox").hide();
        $(".violationPriceBox").hide();
        $(".royaltyPriceBox").hide();
        if (totalEquipmentsPrice > 0) {
            $(".payEquipmentsAttachBox").show();
        } else {
            $(".payEquipmentsAttachBox").hide();
        }
    } else if (violtionPriceType == "fixed" || violtionPriceType == "store") {
        $(".payEquipmentsAttachBox").hide();
        $(".payRoyaltyAttachBox").hide();
        $(".equipmentsPriceBox").hide();
        $(".royaltyPriceBox").hide();
        $(".violationPriceBox")
            .removeClass("col-md-4")
            .addClass("col-md-7");
    }

    // FILE UPLOAD HANDLER
    function handleFileUpload(selector, setFiles) {
        $(selector).on("change", (e) => {
            let files = e.currentTarget.files;
            const dropArea = $(e.currentTarget)
                .parents(".fileBox")
                .siblings(".dropFilesArea");
            dropArea.empty();

            for (let i = 0; i < files.length; i++) {
                let ext = files[i].name.split(".").pop().toLowerCase();
                if ($.inArray(ext, filesExtension) === -1) {
                    functions.warningAlert(
                        "من فضلك أدخل الملفات بالمرفقات المسموح بها فقط"
                    );
                    $(e.currentTarget).val("");
                    dropArea.hide();
                    setFiles(null);
                    return;
                }
            }

            setFiles(files);

            if (files.length > 0) {
                dropArea.show();
            }

            for (let i = 0; i < files.length; i++) {
                dropArea.append(`
                    <div class="file">
                        <p class="fileName">${files[i].name}</p>
                        <span class="deleteFile" data-index="${i}">
                            <i class="fa-sharp fa-solid fa-x"></i>
                        </span>
                    </div>
                `);
            }

            dropArea.find(".deleteFile").on("click", (event) => {
                let index = $(event.currentTarget).closest(".file").index();
                $(event.currentTarget).closest(".file").remove();
                let fileBuffer = new DataTransfer();
                for (let i = 0; i < files.length; i++) {
                    if (index !== i) {
                        fileBuffer.items.add(files[i]);
                    }
                }
                files = fileBuffer.files;
                setFiles(files);
                if (files.length === 0) {
                    dropArea.hide();
                }
            });
        });
    }

    // REGISTER FILE HANDLERS
    handleFileUpload("#attachQuarryPaymentReceipt", (files) => {
        paymentQuarryReceipt = files;
    });

    handleFileUpload("#attachLawRoyaltyPaymentReceipt", (files) => {
        paymentRoyaltyReceipt = files;
    });

    handleFileUpload("#attachEquipmentsPaymentReceipt", (files) => {
        paymentEquipmentsReceipt = files;
    });

    // INPUT FORMAT
    $(".payedPrice").on("keyup", (e) => {
        let val = $(e.currentTarget).val().replace(/,/g, "");
        $(e.currentTarget).val(
            val.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",")
        );
        payedPrice = Number(val);
    });

    $(".payedPrice").on("keypress", (e) => {
        return functions.isDecimalNumberKey(e);
    });

    // FULL PAYMENT
    $(".payAllPrice").off("click").on("click", () => {
        if (payedPrice === "" || !PositiveDecimalNumbers.test(payedPrice)) {
            functions.warningAlert(
                "من فضلك قم بإدخال المبلغ المراد تسديده وبشكل صحيح"
            );
            return;
        }

        if (Number(payedPrice) !== TotalPrice) {
            functions.warningAlert(
                "المبلغ الذي أدخلته غير مطابق للمبلغ الكامل للمخالفة"
            );
            return;
        }

        if (!validateAllAttachments()) {
            return;
        }

        request = {
            Data: {
                ID: taskId,
                ViolationId: violationId,
                ActualAmountPaid: Number(payedPrice),
                Status: "Paid",
                Violation: {
                    RemainingAmount: 0,
                    TotalInstallmentsPaidAmount: totalInstallmentsPaidAmount + Number(payedPrice),
                },
            },
        };

        $(".overlay").addClass("active");

        ExternalViolationLog.payRequest(
            taskId,
            request,
            "FullPay",
            offenderType
        );
    });

    // INSTALLMENT PAYMENT
    $(".payInstallment").off("click").on("click", () => {
        if (!payedPrice || payedPrice <= 0) {
            functions.warningAlert("من فضلك أدخل مبلغ صحيح");
            return;
        }

        if (payedPrice > remainingAmount) {
            functions.warningAlert("المبلغ المدخل أكبر من المبلغ المتبقي");
            return;
        }

        if (!validateAllAttachments()) {
            return;
        }

        // Calculate actual remaining amount
        let remainingAmount = TotalPrice - totalInstallmentsPaidAmount;  // calculates the amount remaining before the current installment
        let newRemainingAmount = remainingAmount - payedPrice;  // then calculates the amount remaining after paying the current installment.

        let isLastInstallment = newRemainingAmount === 0;  // true if newRemainingAmount === 0

        request = {
            Data: {
                ID: taskId,
                ViolationId: violationId,
                ActualAmountPaid: payedPrice,
                Status: isLastInstallment ? "Paid" : "UnderPayment",
                Violation: {
                    IsInstallment: true,
                    InstallmentAmount: payedPrice,
                    RemainingAmount: newRemainingAmount,
                    PaymentDurationMonths: paymentDurationMonths,
                    TotalInstallmentsPaidAmount: totalInstallmentsPaidAmount + payedPrice,

                    ...(isLastInstallment && {
                        IsLastInstallment: true,
                    }),
                },
            },
        };

        $(".overlay").addClass("active");

        ExternalViolationLog.payRequest(
            taskId,
            request,
            "InstallmentPay",
            offenderType
        );
    });
};
///////////////////////////////////////////////////////////
// Pay Installment
ExternalViolationLog.getViolationDetailsForPayment = (taskID) => {
    let request = {
        Id: taskID,
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            $(".overlay").removeClass("active");
            let TaskData = data.d;
            let violationData = TaskData.Violation;
            let offenderType = violationData.OffenderType;
            let Content = '';

            // Get the appropriate details popup content based on offender type
            if (offenderType == "Quarry") {
                Content = DetailsPopup.quarryDetailsPopupContent(
                    violationData,
                    "منظورة خارجياً"
                );
            } else if (offenderType == "Vehicle") {
                Content = DetailsPopup.vehicleDetailsPopupContent(
                    violationData,
                    "منظورة خارجياً"
                );
            } else if (offenderType == "Equipment") {
                Content = DetailsPopup.equipmentDetailsPopupContent(
                    violationData,
                    "منظورة خارجياً"
                );
            }

            // Find the last section (the "تسديد المخالفة" section) and replace it with our payment form
            let lastSectionStart = Content.lastIndexOf('<div class="popupFormBoxHeader">');
            if (lastSectionStart !== -1) {
                Content = Content.substring(0, lastSectionStart);
            }

            // Add our payment form
            let paymentForm = ExternalViolationLog.paymentFormHtml(TaskData);
            Content += paymentForm;

            // Wrap in printBox and declare popup
            let printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
            functions.declarePopup(
                ["generalPopupStyle", "detailsPopup"],
                printBox
            );

            // Add vehicle type specific handling
            if (offenderType == "Vehicle") {
                let VehcleType = violationData.VehicleType;
                if (VehcleType == "عربة بمقطورة") {
                    $(".TrailerNumberBox").show();
                } else {
                    $(".TrailerNumberBox").hide();
                }
            }

            // Get the expiration date
            let ExDate = functions.getFormatedDate(TaskData?.ReconciliationExpiredDate);

            // Call popupPermissionShowTypes to handle visibility and toggle functionality
            ExternalViolationLog.popupPermissionShowTypes("PaymentForm", taskID, ExDate);

            // Setup payment form actions
            ExternalViolationLog.paymentFormActions();

            // Add print functionality
            $(".printBtn").on("click", (e) => {
                functions.PrintDetails(e);
            });

            // Hide action buttons specific to external violations payment
            $(".approveViolation, .rejectViolation, .confirmViolation, .editMaterialMinPrice").hide();
            $(".detailsPopupForm").addClass("externalTasks");

        })
        .catch((err) => {
            console.log(err);
            $(".overlay").removeClass("active");
        });
};


///////////////////////////////////////////////////////////

// ===============================
//  Violation History Tracking for External Violations
// ===============================
ViolationHistoryLogs.init(".contentContainer");


export default ExternalViolationLog;





