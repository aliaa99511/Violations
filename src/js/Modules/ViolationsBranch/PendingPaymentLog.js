import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let pendingPayment = {};
pendingPayment.pageIndex = 1;
pendingPayment.destroyTable = false;

pendingPayment.getPendingPayment = (
    pageIndex = 1,
    destroyTable = false,
    ViolationSector = Number($("#violationSector").children("option:selected").val()),
    ViolationType = Number($("#TypeofViolation").children("option:selected").data("id")),
    ViolationGeneralSearch = ""
) => {
    // Check if theCode field has a value but violationCategory is empty
    const theCodeValue = $("#theCode").val();
    const violationCategoryValue = $("#violationCategory").val();

    if (theCodeValue && theCodeValue.trim() !== "" && (!violationCategoryValue || violationCategoryValue === "")) {
        functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة");
        $(".PreLoader").removeClass("active");
        return;
    }

    const theCode = violationCategoryValue == "Quarry"
        ? { QuarryCode: $("#theCode").val() }
        : { CarNumber: $("#theCode").val() };

    let request = {
        Data: {
            ...theCode,
            RowsPerPage: 10,
            PageIndex: pagination.currentPage,
            ColName: "created",
            SortOrder: "desc",
            Status: "UnderPayment",
            Sector: 0,
            ViolationType: ViolationType,
            SectorConfigId: ViolationSector,
            GlobalSearch: $("#violationSearch").val(),
            OffenderType: $("#violationCategory").val(),
            ViolatorName: $("#violatorName").val(),
            ViolatorCompany: $("#companyName").val(),
            CreatedFrom: $("#createdFrom").val()
                ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
            CreatedTo: $("#createdTo").val()
                ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
        }
    };

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
            $(".PreLoader").removeClass("active");
            let pendingPaymentData = [];
            let ItemsData = data.d.Result;
            if (data.d.Result.GridData != null) {
                if (data.d.Result.GridData.length > 0) {
                    Array.from(data.d.Result.GridData).forEach((element) => {
                        pendingPaymentData.push(element);
                    });
                } else {
                    pendingPaymentData = [];
                }
            }

            pendingPayment.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
            pendingPayment.PendingPaymentTable(pendingPaymentData, destroyTable);
            pendingPayment.pageIndex = ItemsData.CurrentPage;
        })
        .catch((err) => {
            console.log(err);
        });
};

pendingPayment.setPaginations = (TotalPages, RowsPerPage) => {
    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", pendingPayment.getPendingPayment);
    pagination.activateCurrentPage();
};

pendingPayment.filterPaymentsLog = () => {
    let pageIndex = pendingPayment.pageIndex;
    let ViolationSectorVal = $("#violationSector").children("option:selected").val();
    let ViolationTypeVal = $("#TypeofViolation").children("option:selected").data("id");
    let ViolationGeneralSearch = $("#violationSearch").val();
    const theCodeValue = $("#theCode").val();
    const violationCategoryValue = $("#violationCategory").val();

    // Check if theCode has value but violationCategory is empty
    if (theCodeValue && theCodeValue.trim() !== "" && (!violationCategoryValue || violationCategoryValue === "")) {
        functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة قبل إدخال رقم المحجر/عربة/معدة");
        return;
    }

    let ViolationType;
    let ViolationSector;

    if (
        ViolationTypeVal == "" &&
        ViolationSectorVal == "" &&
        ViolationGeneralSearch == ""
    ) {
        functions.warningAlert(
            "من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث"
        );
    } else if (
        ViolationSectorVal != "" ||
        ViolationTypeVal != "0" ||
        ViolationGeneralSearch != ""
    ) {
        $(".PreLoader").addClass("active");
        ViolationSector = Number($("#violationSector").children("option:selected").val());
        ViolationType = Number($("#TypeofViolation").children("option:selected").data("id"));
        pendingPayment.getPendingPayment(
            pageIndex,
            true,
            ViolationSector,
            ViolationType,
            ViolationGeneralSearch
        );
    }
};

pendingPayment.resetFilter = (e) => {
    e.preventDefault();
    $("#violationSector").val("0");
    $("#violationCategory").val("");
    $("#TypeofViolation").val("0");
    $("#violationSearch").val("");
    $("#violatorName").val("");
    $("#companyName").val("");
    $("#theCode").val("");
    $("#createdFrom").val("");
    $("#createdTo").val("");

    $(".PreLoader").addClass("active");
    pagination.reset();
    pendingPayment.getPendingPayment();
};

pendingPayment.handleViolationCategoryChange = () => {
    $("#violationCategory").on("change", function () {
        const selectedCategory = $(this).val();
        const $theCodeField = $("#theCode");
        const $typeOfViolationField = $("#TypeofViolation");

        // First, enable both fields
        $theCodeField.prop("disabled", false);
        $typeOfViolationField.prop("disabled", false);

        // Handle "Equipment" selection
        if (selectedCategory === "Equipment") {
            $theCodeField.prop("disabled", true).val(""); // Disable and clear the field
            $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
        }

        // Handle "Vehicle" selection
        else if (selectedCategory === "Vehicle") {
            $typeOfViolationField.prop("disabled", true).val("0"); // Disable and set to default
            // theCode field remains enabled
        }
    });
};

const originalResetFilter = pendingPayment.resetFilter;
pendingPayment.resetFilter = function (e) {
    // Call the original resetFilter function
    originalResetFilter.call(this, e);

    // Re-enable both fields after reset
    $("#theCode").prop("disabled", false);
    $("#TypeofViolation").prop("disabled", false);
};

pendingPayment.exportToExcel = () => {
    // Get current filter values
    const theCodeValue = $("#theCode").val();
    const violationCategoryValue = $("#violationCategory").val();

    const theCode = {};
    if (theCodeValue && theCodeValue.trim() !== "" && violationCategoryValue) {
        if (violationCategoryValue === "Quarry") {
            theCode.QuarryCode = theCodeValue;
        } else if (violationCategoryValue === "Vehicle") {
            theCode.CarNumber = theCodeValue;
        }
    }

    const currentFilters = {
        ...theCode,
        RowsPerPage: 10000000, // Get all records for export
        PageIndex: 1,
        ColName: "created",
        SortOrder: "desc",
        Status: "UnderPayment",
        Sector: 0,
        ViolationType: Number($("#TypeofViolation").children("option:selected").data("id")),
        SectorConfigId: Number($("#violationSector").children("option:selected").val()),
        GlobalSearch: $("#violationSearch").val(),
        OffenderType: $("#violationCategory").val(),
        ViolatorName: $("#violatorName").val(),
        ViolatorCompany: $("#companyName").val(),
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
            title: "إسم المخالف",
            data: "Violation.ViolatorName",
        },
        {
            title: "إسم الشركة المخالفة",
            data: "Violation.ViolatorCompany",
        },
        {
            title: "رقم المحجر/العربة",
            render: (record) => {
                const violation = record.Violation;
                if (!violation) return "---";
                return violation.OffenderType === "Vehicle"
                    ? (violation.CarNumber || "---")
                    : (violation.QuarryCode || "---");
            },
        },
        {
            title: "نوع المخالفة",
            render: (record) => functions.getViolationArabicName(
                record.Violation?.OffenderType,
                record.Violation?.ViolationTypes?.Title
            ),
        },
        {
            title: "المنطقة",
            data: "Violation.ViolationsZone",
        },
        {
            title: "تاريخ أخر قسط",
            render: (record) => {
                const installmentDate = record.Violation?.InstallmentDate;
                return installmentDate ? functions.getFormatedDate(installmentDate) : "-";
            },
        },
        {
            title: "المبلغ المسدد",
            render: (record) => functions.splitBigNumbersByComma(record.Violation?.TotalInstallmentsPaidAmount || 0),
        },
        {
            title: "المبلغ المتبقي",
            render: (record) => functions.splitBigNumbersByComma(record.Violation?.RemainingAmount || 0),
        },
    ];

    functions.exportFromAPI({
        searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search",
        requestData: { Data: currentFilters },
        columns: columns,
        fileName: "المخالفات قيد السداد.xlsx",
        sheetName: "المخالفات قيد السداد",
        columnWidths: 25,
        rtl: true,
        dataPath: "d.Result.GridData",
        exportButtonSelector: "#exportBtn",
        tableSelector: "#PendingPaymentLog"
    });
};
pendingPayment.PendingPaymentTable = (PendingPaymentData, destroyTable) => {
    let data = [];
    let taskViolation;

    if (PendingPaymentData.length > 0) {
        PendingPaymentData.forEach((record) => {
            taskViolation = record.Violation;
            let installmentDate = taskViolation?.InstallmentDate
                ? functions.getFormatedDate(taskViolation.InstallmentDate)
                : "-";

            if (taskViolation) {
                data.push([
                    `<div class="violationId" 
                          data-taskid="${record.ID}" 
                          data-violationid="${record?.ID}" 
                          data-taskstatus="${record?.Status}" 
                          data-offendertype="${taskViolation.OffenderType}" 
                          data-violationcode="${taskViolation.ViolationCode}" 
                          data-totalprice="${taskViolation?.TotalPriceDue}" 
                          data-actualpaid="${taskViolation?.ActualAmountPaid}" 
                          data-remainingamount="${taskViolation?.RemainingAmount}"
                          data-lawroyalty="${taskViolation?.LawRoyalty}"
                          data-totalequipmentsprice="${taskViolation?.TotalEquipmentsPrice}"
                          data-violationpricetype="${taskViolation?.ViolationTypes?.PriceType || ''}"
                          data-printedcount="${record?.PrintedCount || 0}"
                          data-totalinstallmentspaidamount="${taskViolation?.TotalInstallmentsPaidAmount || 0}"
                          >
                          ${taskViolation.ViolationCode || "-"}
                      </div>`,
                    `<div class='controls'>
                        <div class='ellipsisButton'>
                            <i class='fa-solid fa-ellipsis-vertical'></i>
                        </div>
                        <div class="hiddenListBox">
                            <div class='arrow'></div>
                            <ul class='list-unstyled controlsList'>
                                <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
                                <li><a href="#" class="payInstallment">تسديد قسط</a></li>
                            </ul>
                        </div>
                    </div>`,
                    `<div class="violationArName">${functions.getViolationArabicName(
                        taskViolation.OffenderType
                    ) || "-"}</div>`,
                    `<div class="violatorName">${taskViolation.ViolatorName || '-'}</div>`,
                    `<div class="companyName">${taskViolation.ViolatorCompany != ""
                        ? taskViolation.ViolatorCompany
                        : "-"
                    }</div>`,
                    `<div class="violationCode" data-offendertype="${taskViolation.OffenderType
                    }">${taskViolation.OffenderType == "Vehicle"
                        ? taskViolation.CarNumber
                        : taskViolation.QuarryCode != ""
                            ? taskViolation.QuarryCode
                            : "---"
                    }</div>`,
                    `<div class="violationType" data-typeid="${taskViolation.OffenderType == "Quarry"
                        ? taskViolation.ViolationTypes.ID
                        : 0
                    }">${functions.getViolationArabicName(
                        taskViolation.OffenderType,
                        taskViolation?.ViolationTypes?.Title
                    )}</div>`,
                    `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
                    `${installmentDate || "-"}`,
                    `${functions.splitBigNumbersByComma(taskViolation?.TotalInstallmentsPaidAmount || 0) || "-"}`,
                    `${functions.splitBigNumbersByComma(taskViolation?.RemainingAmount || 0) || "-"}`,
                ]);
            }
        });
    }

    if (pendingPayment.destroyTable || destroyTable) {
        $("#PendingPaymentLog").DataTable().destroy();
    }

    let Table = functions.tableDeclare(
        "#PendingPaymentLog",
        data,
        [
            { title: "رقم المخالفة" },
            { title: "", class: "all" },
            { title: "تصنيف المخالفة" },
            { title: "إسم المخالف" },
            { title: "إسم الشركة المخالفة" },
            { title: " رقم المحجر/العربة" },
            { title: "نوع المخالفة " },
            { title: "المنطقة" },
            { title: "تاريخ أخر قسط" },
            { title: "المبلغ المسدد" },
            { title: "المبلغ المتبقي" },
        ],
        false,
        false,
        "المخالفات قيد السداد.xlsx",
        "المخالفات قيد السداد"
    );

    // 🔹 create column selector
    functions.createColumnSelector(Table, "#columnSelector", 'green');

    pendingPayment.destroyTable = true;

    $("#exportBtn").off("click").on("click", () => {
        pendingPayment.exportToExcel();
    });

    // Use event delegation for ellipsis button clicks
    $(document).on("click", ".ellipsisButton", function (e) {
        e.stopPropagation();
        $(".hiddenListBox").hide(300);
        $(this).siblings(".hiddenListBox").toggle(300);
    });

    let paymentLog = Table.rows().nodes().to$();
    let UserId = _spPageContextInfo.userId;

    functions.callSharePointListApi("Configurations").then((Users) => {
        let UserDetails;
        let UsersData = Users.value;
        UsersData.forEach((User) => {
            if (User.UserIdId.find((id) => id == UserId)) {
                UserDetails = User;
            }
        });

        $.each(paymentLog, (index, record) => {
            let jQueryRecord = $(record);
            let taskID = jQueryRecord.find(".violationId").data("taskid");

            let hiddenListBox = jQueryRecord.find(".controls").children(".hiddenListBox");

            if (
                paymentLog.length > 4 &&
                hiddenListBox.height() > 110 &&
                jQueryRecord.is(":nth-last-child(-n + 4)")
            ) {
                hiddenListBox.addClass("toTopDDL");
            }

            jQueryRecord
                .find(".controls")
                .children(".hiddenListBox")
                .find(".itemDetails")
                .on("click", (e) => {
                    $(".overlay").addClass("active");
                    pendingPayment.findViolationByID(e, taskID, false);
                });

            jQueryRecord
                .find(".controls")
                .children(".hiddenListBox")
                .find(".payInstallment")
                .on("click", (e) => {
                    $(".overlay").addClass("active");
                    pendingPayment.getViolationDetailsForPayment(taskID);
                });
        });
    });

    functions.hideTargetElement(".controls", ".hiddenListBox");
};

pendingPayment.getViolationDetailsForPayment = (taskID) => {
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
                    "قيد السداد"
                );
            } else if (offenderType == "Vehicle") {
                Content = DetailsPopup.vehicleDetailsPopupContent(
                    violationData,
                    "قيد السداد"
                );
            } else if (offenderType == "Equipment") {
                Content = DetailsPopup.equipmentDetailsPopupContent(
                    violationData,
                    "قيد السداد"
                );
            }

            // Find the last section (the "تسديد المخالفة" section) and replace it with our payment form
            let lastSectionStart = Content.lastIndexOf('<div class="popupFormBoxHeader">');
            if (lastSectionStart !== -1) {
                // Find where this section ends - look for the closing tag of the section
                // The section likely ends with a closing div after the formButtonsBox
                let sectionEnd = Content.lastIndexOf('</div>', Content.length - 10);
                if (sectionEnd !== -1 && sectionEnd > lastSectionStart) {
                    // Keep everything before this section
                    Content = Content.substring(0, lastSectionStart);
                }
            }

            // Add our payment form (which already includes its own header with "تسديد القسط")
            let paymentForm = pendingPayment.paymentFormHtml(TaskData);
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
            pendingPayment.popupPermissionShowTypes("PaymentForm", taskID, ExDate);

            // Setup payment form actions
            pendingPayment.paymentFormActions(TaskData);

            // Add print functionality
            $(".printBtn").on("click", (e) => {
                functions.PrintDetails(e);
            });

            // Hide action buttons specific to pending payment
            $(".approveViolation, .rejectViolation, .confirmViolation, .editMaterialMinPrice").hide();
            $(".detailsPopupForm").addClass("pendingPayment");

        })
        .catch((err) => {
            console.log(err);
            $(".overlay").removeClass("active");
        });
};
pendingPayment.paymentFormHtml = (TaskData) => {
    let violationData = TaskData.Violation;
    let offenderType = violationData.OffenderType;
    let violationPriceType = violationData.ViolationTypes?.PriceType || "";
    let TotalViolationPrice = violationData.TotalPriceDue;
    let RoyaltyPrice = violationData.LawRoyalty;
    let QuarryMaterialValue = violationData.QuarryMaterialValue;
    let totalInstallmentsPaidAmount = violationData?.TotalInstallmentsPaidAmount || 0;

    // Get formatted end date (or "-" if null)
    let endDate = functions.getFormatedDate(TaskData?.ReconciliationExpiredDate);
    endDate = endDate === "01-01-2001" ? "-" : endDate;

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
                <input class="form-control customInput quarryPrice disabledInput" id="quarryPrice" type="text" value="${functions.splitBigNumbersByComma(inputVal)}" disabled>
            </div>
        </div>
        <div class="col-md-4 royaltyPriceBox">
            <div class="form-group customFormGroup">
                <label for="royaltyPrice" class="customLabel">قيمة الإتاوة</label>
                <input class="form-control customInput royaltyPrice disabledInput" id="royaltyPrice" type="text" value="${functions.splitBigNumbersByComma(violationData?.LawRoyalty)}" disabled>
            </div>
        </div>
        <div class="col-md-4 equipmentsPriceBox">
            <div class="form-group customFormGroup">
                <label for="equipmentsPrice" class="customLabel">غرامة المعدات</label>
                <input class="form-control customInput equipmentsPrice disabledInput" id="equipmentsPrice" type="text" value="${functions.splitBigNumbersByComma(violationData?.TotalEquipmentsPrice)}" disabled>
            </div>
        </div>
    `;

    let vehiclePriceInDetails = `
        <div class="col-md-6">
            <div class="form-group customFormGroup">
                <label for="quarryPrice" class="customLabel">${labelText}</label>
                <input class="form-control customInput quarryPrice disabledInput" id="quarryPrice" type="text" value="${functions.splitBigNumbersByComma(inputVal)}" disabled>
            </div>
        </div>
        <div class="col-md-6">
            <div class="form-group customFormGroup">
                <label for="royaltyPrice" class="customLabel">قيمة الإتاوة</label>
                <input class="form-control customInput royaltyPrice disabledInput" id="royaltyPrice" type="text" value="${functions.splitBigNumbersByComma(violationData?.LawRoyalty)}" disabled>
            </div>
        </div>
    `;

    let equipmentsPriceInDetails = `
        <div class="col-md-6 equipmentsPriceBox">
            <div class="form-group customFormGroup">
                <label for="equipmentsPrice" class="customLabel">غرامة المعدات</label>
                <input class="form-control customInput equipmentsPrice disabledInput" id="equipmentsPrice" type="text" value="${functions.splitBigNumbersByComma(violationData?.TotalEquipmentsPrice)}" disabled>
            </div>
        </div>
    `;

    let paymentFormHtml = `
        <div class="popupFormBoxHeader">
            <p class="formBoxTitle"><span class="formNumber">2</span> تسديد القسط</p>
        </div>
        <div class="paymentFormBody">
            <div class="popupForm paymentForm" id="paymentForm" 
                    data-taskid="${TaskData.ID}" 
                    data-violationid="${TaskData.ViolationId}" 
                    data-actualprice="${violationData.ActualAmountPaid}" 
                    data-lawroyalty="${violationData.LawRoyalty}" 
                    data-totalequipmentsprice="${violationData.TotalEquipmentsPrice}" 
                    data-totalprice="${violationData.TotalPriceDue}" 
                    data-offendertype="${violationData.OffenderType}" 
                    data-violationpricetype="${offenderType == "Quarry" ? violationPriceType : 0}"
                    data-totalinstallmentspaidamount="${totalInstallmentsPaidAmount}">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                ${offenderType == "Quarry" ? quarryPriceInDetails :
            offenderType == "Vehicle" ? vehiclePriceInDetails :
                offenderType == "Equipment" ? equipmentsPriceInDetails : ""}
                                
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="totalPrice" class="customLabel">إجمالي قيمة المخالفة</label>
                                        <input class="form-control customInput totalPrice disabledInput" id="totalPrice" type="text" 
                                              value="${functions.splitBigNumbersByComma(violationData?.TotalPriceDue) || ""}" disabled>
                                    </div>
                                    
                                    <div class="form-group customFormGroup">
                                        <label for="reconciliationPeriod" class="customLabel">تاريخ نهاية مدة التصالح</label>
                                        <div class="inputIconBox">
                                            <input class="form-control customInput reconciliationPeriod disabledInput" id="reconciliationPeriod" type="text" 
                                                    value="${endDate}" disabled>
                                            <i class="fa-solid fa-calendar-days"></i>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group customFormGroup actualRemainigPriceBox">
                                        <label class="customLabel">المبلغ المتبقي</label>
                                        <input class="form-control customInput disabledInput remainingAmount" type="text" 
                                               value="${functions.splitBigNumbersByComma(violationData?.RemainingAmount) || ""}" disabled>
                                    </div>
                                    
                                    <div class="form-group customFormGroup">
                                        <div class="feildInfoBox">
                                            <label for="payedPrice" class="customLabel">المبلغ المراد تسديده *</label>
                                            <span class="metaDataSpan">بالجنيه المصري</span>
                                        </div>
                                        <input class="form-control customInput payedPrice greenCustomInput" id="payedPrice" type="text" placeholder="ادخل المبلغ المراد تسديده">
                                    </div>
                                    
                                    <!---------------------  سداد بالتقسيط - ALWAYS CHECKED IN PENDING PAYMENT -->
                                    <div class="form-group customFormGroup installmentBox">
                                      <label class="checkboxLabel">
                                        <input
                                          type="checkbox"
                                          class="installmentCheckbox"
                                          checked
                                          disabled
                                        />
                                        سداد بالتقسيط
                                      </label>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    ${offenderType != "Equipment" ? `
                                    <div class="form-group customFormGroup payQuarryAttachBox">
                                        <label for="attachQuarryPaymentReceipt" class="customLabel">إرفاق إيصال غرامة القيمة المحجرية</label>
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
                                        <label for="attachLawRoyaltyPaymentReceipt" class="customLabel">إرفاق إيصال الإتاوة</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <input type="file" class="customInput attachFilesInput attachLawRoyaltyPaymentReceipt form-control" id="attachLawRoyaltyPaymentReceipt" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx">
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                    ` : ""}
                                    
                                    <div class="form-group customFormGroup payEquipmentsAttachBox" 
                                          style="display:${offenderType == "Quarry" || offenderType == "Equipment" ? "block !important" : "none !important"}">
                                        <label for="attachEquipmentsPaymentReceipt" class="customLabel">إرفاق إيصال غرامة المعدات</label>
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
                                <div class="btnStyle confirmBtnGreen popupBtn payInstallmentBtn">
                                  تسديد قسط
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
pendingPayment.showInstallmentPaymentPopup = (TaskData) => {
    let violationData = TaskData.Violation;
    let offenderType = violationData.OffenderType;
    let violationPriceType = violationData.ViolationTypes?.PriceType || "";
    let TotalViolationPrice = violationData.TotalPriceDue;
    let RoyaltyPrice = violationData.LawRoyalty;
    let QuarryMaterialValue = violationData.QuarryMaterialValue;

    // Add this line to get the total installments paid amount
    let totalInstallmentsPaidAmount = violationData?.TotalInstallmentsPaidAmount || 0;

    // Get formatted end date (or "-" if null)
    let endDate = functions.getFormatedDate(TaskData?.ReconciliationExpiredDate);
    endDate = endDate === "01-01-2001" ? "-" : endDate;

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
                <input class="form-control customInput quarryPrice disabledInput" id="quarryPrice" type="text" value="${functions.splitBigNumbersByComma(inputVal)}" disabled>
            </div>
        </div>
        <div class="col-md-4 royaltyPriceBox">
            <div class="form-group customFormGroup">
                <label for="royaltyPrice" class="customLabel">قيمة الإتاوة</label>
                <input class="form-control customInput royaltyPrice disabledInput" id="royaltyPrice" type="text" value="${functions.splitBigNumbersByComma(violationData?.LawRoyalty)}" disabled>
            </div>
        </div>
        <div class="col-md-4 equipmentsPriceBox">
            <div class="form-group customFormGroup">
                <label for="equipmentsPrice" class="customLabel">غرامة المعدات</label>
                <input class="form-control customInput equipmentsPrice disabledInput" id="equipmentsPrice" type="text" value="${functions.splitBigNumbersByComma(violationData?.TotalEquipmentsPrice)}" disabled>
            </div>
        </div>
    `;

    let vehiclePriceInDetails = `
        <div class="col-md-6">
            <div class="form-group customFormGroup">
                <label for="quarryPrice" class="customLabel">${labelText}</label>
                <input class="form-control customInput quarryPrice disabledInput" id="quarryPrice" type="text" value="${functions.splitBigNumbersByComma(inputVal)}" disabled>
            </div>
        </div>
        <div class="col-md-6">
            <div class="form-group customFormGroup">
                <label for="royaltyPrice" class="customLabel">قيمة الإتاوة</label>
                <input class="form-control customInput royaltyPrice disabledInput" id="royaltyPrice" type="text" value="${functions.splitBigNumbersByComma(violationData?.LawRoyalty)}" disabled>
            </div>
        </div>
    `;

    let equipmentsPriceInDetails = `
        <div class="col-md-6 equipmentsPriceBox">
            <div class="form-group customFormGroup">
                <label for="equipmentsPrice" class="customLabel">غرامة المعدات</label>
                <input class="form-control customInput equipmentsPrice disabledInput" id="equipmentsPrice" type="text" value="${functions.splitBigNumbersByComma(violationData?.TotalEquipmentsPrice)}" disabled>
            </div>
        </div>
    `;

    let paymentFormHtml = `
        <div class="paymentFormBody">
            <div class="popupForm paymentForm" id="paymentForm" 
                    data-taskid="${TaskData.ID}" 
                    data-violationid="${TaskData.ViolationId}" 
                    data-actualprice="${violationData.ActualAmountPaid}" 
                    data-lawroyalty="${violationData.LawRoyalty}" 
                    data-totalequipmentsprice="${violationData.TotalEquipmentsPrice}" 
                    data-totalprice="${violationData.TotalPriceDue}" 
                    data-offendertype="${violationData.OffenderType}" 
                    data-violationpricetype="${offenderType == "Quarry" ? violationPriceType : 0}"
                    data-totalinstallmentspaidamount="${totalInstallmentsPaidAmount}">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                ${offenderType == "Quarry" ? quarryPriceInDetails :
            offenderType == "Vehicle" ? vehiclePriceInDetails :
                offenderType == "Equipment" ? equipmentsPriceInDetails : ""}
                                
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="totalPrice" class="customLabel">إجمالي قيمة المخالفة</label>
                                        <input class="form-control customInput totalPrice disabledInput" id="totalPrice" type="text" 
                                              value="${functions.splitBigNumbersByComma(violationData?.TotalPriceDue) || ""}" disabled>
                                    </div>
                                    
                                    <div class="form-group customFormGroup">
                                        <label for="reconciliationPeriod" class="customLabel">تاريخ نهاية مدة التصالح</label>
                                        <div class="inputIconBox">
                                            <input class="form-control customInput reconciliationPeriod disabledInput" id="reconciliationPeriod" type="text" 
                                                    value="${endDate}" disabled>
                                            <i class="fa-solid fa-calendar-days"></i>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group customFormGroup actualRemainigPriceBox">
                                        <label class="customLabel">المبلغ المتبقي</label>
                                        <input class="form-control customInput disabledInput remainingAmount" type="text" 
                                               value="${functions.splitBigNumbersByComma(violationData?.RemainingAmount) || ""}" disabled>
                                    </div>
                                    
                                    <div class="form-group customFormGroup">
                                        <div class="feildInfoBox">
                                            <label for="payedPrice" class="customLabel">المبلغ المراد تسديده *</label>
                                            <span class="metaDataSpan">بالجنيه المصري</span>
                                        </div>
                                        <input class="form-control customInput payedPrice greenCustomInput" id="payedPrice" type="text" placeholder="ادخل المبلغ المراد تسديده">
                                    </div>
                                    
                                    <!---------------------  سداد بالتقسيط - ALWAYS CHECKED IN PENDING PAYMENT -->
                                    <div class="form-group customFormGroup installmentBox">
                                      <label class="checkboxLabel">
                                        <input
                                          type="checkbox"
                                          class="installmentCheckbox"
                                          checked
                                          disabled
                                        />
                                        سداد بالتقسيط
                                      </label>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    ${offenderType != "Equipment" ? `
                                    <div class="form-group customFormGroup payQuarryAttachBox">
                                        <label for="attachQuarryPaymentReceipt" class="customLabel">إرفاق إيصال غرامة القيمة المحجرية</label>
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
                                        <label for="attachLawRoyaltyPaymentReceipt" class="customLabel">إرفاق إيصال الإتاوة</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <input type="file" class="customInput attachFilesInput attachLawRoyaltyPaymentReceipt form-control" id="attachLawRoyaltyPaymentReceipt" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx">
                                            </div>
                                        </div>
                                        <div class="dropFilesArea" id="dropFilesArea"></div>
                                    </div>
                                    ` : ""}
                                    
                                    <div class="form-group customFormGroup payEquipmentsAttachBox" 
                                          style="display:${offenderType == "Quarry" || offenderType == "Equipment" ? "block !important" : "none !important"}">
                                        <label for="attachEquipmentsPaymentReceipt" class="customLabel">إرفاق إيصال غرامة المعدات</label>
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
                                <div class="btnStyle confirmBtnGreen popupBtn payInstallmentBtn">
                                  تسديد قسط
                                </div>
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    functions.declarePopup(
        ["generalPopupStyle", "detailsPopup"],
        paymentFormHtml
    );

    pendingPayment.paymentFormActions(TaskData);
};

pendingPayment.paymentFormActions = (TaskData) => {
    let request = {};
    let violtionPriceType = $(".paymentForm").data("violationpricetype");
    let offenderType = $(".paymentForm").data("offendertype");
    let lawRoyalty = $(".paymentForm").data("lawroyalty");
    let totalEquipmentsPrice = $(".paymentForm").data("totalequipmentsprice");
    let taskId = $(".paymentForm").data("taskid");
    let violationId = $(".paymentForm").data("violationid");
    let TotalPrice = Number($(".paymentForm").data("totalprice"));
    let ActualPrice = Number($(".paymentForm").data("actualprice"));
    let remainingAmount = Number($(".remainingAmount").val()?.replace(/,/g, "") || 0);

    // Add this line to get total installments paid amount
    let totalInstallmentsPaidAmount = Number($(".paymentForm").data("totalinstallmentspaidamount") || 0);

    // Payment duration months - temporary
    let paymentDurationMonths = 2;
    let payedPrice = 0;
    let PositiveDecimalNumbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
    let filesExtension = ["gif", "svg", "jpg", "jpeg", "png", "doc", "docx", "pdf", "xls", "xlsx", "pptx"];
    $(".dropFilesArea").hide();

    // For pending payment, installment is always checked
    $(".installmentCheckbox").prop("checked", true).prop("disabled", true);

    // UI Rules based on violation type
    if (violtionPriceType == "fixed" || violtionPriceType == "store") {
        $(".payEquipmentsAttachBox").hide();
        $(".payRoyaltyAttachBox").hide();
        $(".equipmentsPriceBox").hide();
        $(".royaltyPriceBox").hide();
        $(".violationPriceBox").removeClass("col-md-4").addClass("col-md-7");
    }

    if ($(".equipmentsPriceBox").is(":visible") && $(".royaltyPriceBox").is(":visible")) {
        $(".violationPriceBox").removeClass("col-md-7").addClass("col-md-4");
    }

    // File attachment handlers (same as in validatedViolations)
    let paymentQuarryReceipt;
    let countOfQuarryFiles;
    $("#attachQuarryPaymentReceipt").on("change", (e) => {
        paymentQuarryReceipt = $(e.currentTarget)[0].files;
        if (paymentQuarryReceipt.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < paymentQuarryReceipt.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${paymentQuarryReceipt[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }
        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < paymentQuarryReceipt.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(paymentQuarryReceipt[i]);
                }
            }
            paymentQuarryReceipt = fileBuffer.files;
            countOfQuarryFiles = paymentQuarryReceipt.length;
            if (countOfQuarryFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });
        for (let i = 0; i < paymentQuarryReceipt.length; i++) {
            let fileSplited = paymentQuarryReceipt[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    let paymentRoyaltyReceipt;
    let countOfRoyaltyFiles;
    $("#attachLawRoyaltyPaymentReceipt").on("change", (e) => {
        paymentRoyaltyReceipt = $(e.currentTarget)[0].files;
        if (paymentRoyaltyReceipt.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < paymentRoyaltyReceipt.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${paymentRoyaltyReceipt[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }
        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < paymentRoyaltyReceipt.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(paymentRoyaltyReceipt[i]);
                }
            }
            paymentRoyaltyReceipt = fileBuffer.files;
            countOfRoyaltyFiles = paymentRoyaltyReceipt.length;
            if (countOfRoyaltyFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });
        for (let i = 0; i < paymentRoyaltyReceipt.length; i++) {
            let fileSplited = paymentRoyaltyReceipt[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    let paymentEquipmentsReceipt;
    let countOfEquipmentsFiles;
    $("#attachEquipmentsPaymentReceipt").on("change", (e) => {
        paymentEquipmentsReceipt = $(e.currentTarget)[0].files;
        if (paymentEquipmentsReceipt.length > 0) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
        }
        for (let i = 0; i < paymentEquipmentsReceipt.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${paymentEquipmentsReceipt[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }
        $(".deleteFile").on("click", (event) => {
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < paymentEquipmentsReceipt.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(paymentEquipmentsReceipt[i]);
                }
            }
            paymentEquipmentsReceipt = fileBuffer.files;
            countOfEquipmentsFiles = paymentEquipmentsReceipt.length;
            if (countOfEquipmentsFiles == 0) {
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
            }
        });
        for (let i = 0; i < paymentEquipmentsReceipt.length; i++) {
            let fileSplited = paymentEquipmentsReceipt[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    // Input formatting
    $(".payedPrice").on("keyup", (e) => {
        $(e.currentTarget).val($(e.currentTarget).val().split(",").join(""));
        $(e.currentTarget).val($(e.currentTarget).val().replace(/\B(?=(?:\d{3})+(?!\d))/g, ","));
        payedPrice = $(e.currentTarget).val();
        payedPrice = payedPrice.replace(/\,/g, "");
        payedPrice = Number(payedPrice);
    });

    $(".payedPrice").on("keypress", (e) => {
        return functions.isDecimalNumberKey(e);
    });

    // Installment Payment Logic
    $(".payInstallmentBtn").on("click", () => {
        if (!payedPrice || payedPrice <= 0) {
            functions.warningAlert("من فضلك أدخل مبلغ صحيح");
            return;
        }

        if (payedPrice > remainingAmount) {
            functions.warningAlert("المبلغ المدخل أكبر من المبلغ المتبقي");
            return;
        }

        // File attachment validation for installment
        if (TotalPrice > 0) {
            if ((paymentQuarryReceipt != null && paymentQuarryReceipt.length > 0) || offenderType == "Equipment") {
                if (offenderType == "Quarry" || offenderType == "Equipment") {
                    if ((violtionPriceType != "fixed" && violtionPriceType != "store" && $(".payEquipmentsAttachBox").is(":visible") && $(".payRoyaltyAttachBox").is(":visible")) || offenderType == "Equipment") {
                        if ((paymentRoyaltyReceipt != null && paymentRoyaltyReceipt.length > 0) || offenderType == "Equipment" || lawRoyalty == 0) {
                            if (($("#attachEquipmentsPaymentReceipt")[0] != null && $("#attachEquipmentsPaymentReceipt")[0].files.length > 0) || totalEquipmentsPrice == 0) {
                                // Validation passed, proceed with installment payment
                            } else {
                                functions.warningAlert("من فضلك قم بإرفاق إيصال غرامة المعدات");
                                return;
                            }
                        } else {
                            functions.warningAlert("من فضلك قم بإرفاق إيصال الإتاوة");
                            return;
                        }
                    }
                } else if (offenderType == "Vehicle") {
                    if ((paymentRoyaltyReceipt != null && paymentRoyaltyReceipt.length > 0) || lawRoyalty == 0 || offenderType == "Equipment") {
                        // Validation passed, proceed with installment payment
                    } else {
                        functions.warningAlert("من فضلك قم بإرفاق إيصال الإتاوة");
                        return;
                    }
                }
            } else {
                functions.warningAlert("من فضلك قم بإرفاق إيصال غرامة المخالفة المحددة أو غرامة القيمة المحجرية");
                return;
            }
        }

        let newRemainingAmount = remainingAmount - payedPrice;
        let newActualPaid = ActualPrice + payedPrice;
        let newTotalInstallmentsPaidAmount = totalInstallmentsPaidAmount + payedPrice;
        let isLastInstallment = newRemainingAmount === 0;

        let request = {
            Data: {
                ID: taskId,
                ViolationId: violationId,
                ActualAmountPaid: newActualPaid,
                Status: isLastInstallment ? "Paid" : "UnderPayment",
                Violation: {
                    IsInstallment: true,
                    InstallmentAmount: payedPrice,
                    RemainingAmount: newRemainingAmount,
                    PaymentDurationMonths: paymentDurationMonths,
                    InstallmentDate: new Date().toISOString(),
                    TotalInstallmentsPaidAmount: newTotalInstallmentsPaidAmount,
                    ...(isLastInstallment && {
                        IsLastInstallment: true
                    })
                }
            }
        };

        $(".overlay").addClass("active");
        pendingPayment.payRequest(taskId, request, offenderType);
    });
};
pendingPayment.popupPermissionShowTypes = (popupType, TaskId, ExDate) => {
    if (popupType == "Details") {
        $(".totalPriceBox")
            .show()
            .find(".violationEndTime")
            .val(ExDate == "01-01-2001" ? "-" : ExDate);
        $(".confirmationAttachBox").show();
        DetailsPopup.getConfirmationAttachments(TaskId);
    } else if (popupType == "PaymentForm") {
        $(".hiddenDetailsBox").addClass("showHiddenDetailsBox");
        $(".totalPriceBox")
            .show()
            .find(".violationEndTime")
            .val(ExDate == "01-01-2001" ? "-" : ExDate);
        $(".popupFormBoxHeader").show();
        $(".confirmationAttachBox").hide(); // Hide confirmation attachments for payment
        $(".detailsPopupForm").find(".formButtonsBox").hide();
        $(".hiddenDetailsBox").hide();
        $(".showMoreDetails").css("display", "flex");

        // Remove any existing event handlers and attach new one
        $(".showMoreDetails").off("click").on("click", (e) => {
            $(".hiddenDetailsBox").slideToggle();
            $(".showMoreDetails").find("img").toggleClass("rotateDetailsIcon");
            $(".showMoreDetails")
                .find("p")
                .text(
                    $(".showMoreDetails").find("p").text() == "إظهار المزيد من التفاصيل"
                        ? "إخفاء التفاصيل"
                        : "إظهار المزيد من التفاصيل"
                );
        });
    }
};
pendingPayment.payRequest = (TaskId, request, offenderType) => {
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
            pendingPayment.uploadPaymentReceiptsAttachment(
                TaskId,
                "ViolationsCycle",
                offenderType
            );
        })
        .catch((err) => {
            console.log(err);
            $(".overlay").removeClass("active");
            functions.errorAlert("حدث خطأ أثناء معالجة السداد");
        });
};

pendingPayment.uploadPaymentReceiptsAttachment = (TaskId, ListName, offenderType) => {
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
            let status = requestData?.Data?.Status || "UnderPayment";
            let isLastInstallment = requestData?.Data?.Violation?.IsLastInstallment || false;

            if (status === "Paid" && isLastInstallment) {
                functions.sucessAlert("تم سداد آخر قسط وإنهاء المخالفة");
            } else {
                functions.sucessAlert("تم تسديد القسط بنجاح");
            }

            // Refresh the table
            // $(".PreLoader").addClass("active");
            // pendingPayment.getPendingPayment();
        },
        error: (err) => {
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
            $(".overlay").removeClass("active");
        },
    });
};

pendingPayment.findViolationByID = (event, taskID, print = false) => {
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

            if (data != null) {
                violationData = data.d.Violation;
                violationOffenderType = violationData.OffenderType;

                if (violationOffenderType == "Quarry") {
                    Content = DetailsPopup.quarryDetailsPopupContent(
                        violationData,
                        "قيد السداد"
                    );
                } else if (violationOffenderType == "Vehicle") {
                    Content = DetailsPopup.vehicleDetailsPopupContent(
                        violationData,
                        "قيد السداد"
                    );
                } else if (violationOffenderType == "Equipment") {
                    Content = DetailsPopup.equipmentDetailsPopupContent(
                        violationData,
                        "قيد السداد"
                    );
                }

                printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;

                // ✅ Render popup
                functions.declarePopup(
                    ["generalPopupStyle", "detailsPopup"],
                    printBox
                );

                // ✅ FIX: Hide buttons AFTER rendering
                setTimeout(() => {
                    const popup = $(".detailsPopupForm");

                    popup.find("#editMaterialMinPrice, #payAllPrice")
                        .css("display", "none")
                        .attr("style", "display: none !important");
                }, 50);

                // Vehicle logic
                if (violationOffenderType == "Vehicle") {
                    let VehcleType = violationData.VehicleType;
                    if (VehcleType == "عربة بمقطورة") {
                        $(".TrailerNumberBox").show();
                    } else {
                        $(".TrailerNumberBox").hide();
                    }
                }

                // Hide edit button (extra safety)
                $("#editMaterialMinPrice").hide();

                $(".printBtn").on("click", (e) => {
                    functions.PrintDetails(e);
                });

                if (print) {
                    functions.PrintDetails(event);
                }

                $(".detailsPopupForm").addClass("pendingPayment");
            }
        })
        .catch((err) => {
            console.log(err);
        });
};

// // Initialize when document is ready
// $(document).ready(function () {
//     // Add event listeners for search and reset buttons
//     $(".searchBtn").on("click", pendingPayment.filterPaymentsLog);
//     $(".resetBtn").on("click", pendingPayment.resetFilter);

//     // Initialize the table
//     pendingPayment.getPendingPayment();
// });

export default pendingPayment;