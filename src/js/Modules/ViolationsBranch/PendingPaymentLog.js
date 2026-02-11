import functions from "../../Shared/functions";
import DetailsPopup from "../../Shared/detailsPopupContent";
import pagination from "../../Shared/Pagination";

let pendingPayment = {};
pendingPayment.pageIndex = 1;
pendingPayment.destroyTable = false;

pendingPayment.getPendingPayment = (
    pageIndex = 1,
    destroyTable = false,
    ViolationSector = 0,
    ViolationType = 0,
    GlobalSearch = ""
) => {
    let request = {
        Data: {
            RowsPerPage: pagination.rowsPerPage || 10,
            PageIndex: pageIndex,
            ColName: "created",
            SortOrder: "desc",
            Status: "UnderPayment",
            Sector: ViolationSector,
            ViolationType: ViolationType,
            GlobalSearch: GlobalSearch,
            OffenderType: $("#violationCategory").val(),
            CreatedFrom: $("#createdFrom").val()
                ? moment($("#createdFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : "",
            CreatedTo: $("#createdTo").val()
                ? moment($("#createdTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : "",
        }
    };

    Object.keys(request.Data).forEach(key => {
        if (request.Data[key] === "") {
            delete request.Data[key];
        }
    });

    functions
        .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Search", { request })
        .then(res => res.ok && res.json())
        .then(data => {
            $(".PreLoader").removeClass("active");

            let ItemsData = data.d.Result;
            let GridData = ItemsData.GridData || [];

            pendingPayment.setPaginations(
                ItemsData.TotalPageCount,
                ItemsData.RowsPerPage
            );

            pendingPayment.PendingPaymentTable(GridData, destroyTable);
            pendingPayment.pageIndex = ItemsData.CurrentPage;
        })
        .catch(console.log);
};

pendingPayment.setPaginations = (TotalPages, RowsPerPage) => {
    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", pendingPayment.getPendingPayment);
    pagination.activateCurrentPage();
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
                          ${taskViolation.ViolationCode}
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
                    )}</div>`,
                    `<div class="violationCode" data-offendertype="${taskViolation.OffenderType
                    }">${taskViolation.OffenderType == "Vehicle"
                        ? taskViolation.CarNumber
                        : taskViolation.QuarryCode != ""
                            ? taskViolation.QuarryCode
                            : "---"
                    }</div>`,
                    `<div class="companyName">${taskViolation.ViolatorCompany != ""
                        ? taskViolation.ViolatorCompany
                        : "-"
                    }</div>`,
                    `<div class="violationType" data-typeid="${taskViolation.OffenderType == "Quarry"
                        ? taskViolation.ViolationTypes.ID
                        : 0
                    }">${functions.getViolationArabicName(
                        taskViolation.OffenderType,
                        taskViolation?.ViolationTypes?.Title
                    )}</div>`,
                    `<div class="violationZone">${taskViolation.ViolationsZone}</div>`,
                    `${installmentDate}`,
                    `${functions.splitBigNumbersByComma(taskViolation?.TotalInstallmentsPaidAmount || 0)}`,
                    `${functions.splitBigNumbersByComma(taskViolation?.RemainingAmount || 0)}`,
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
            { title: " رقم المحجر/العربة" },
            { title: "إسم الشركة المخالفة" },
            { title: "نوع المخالفة " },
            { title: "المنطقة" },
            { title: "تاريخ أخر قسط" },
            { title: "المبلغ المسدد" },
            { title: "المبلغ المتبقي" },
        ],
        false,
        false,
        false,
        "المخالفات قيد السداد.xlsx",
        "المخالفات قيد السداد"
    );

    pendingPayment.destroyTable = true;

    $(".ellipsisButton").on("click", (e) => {
        $(".hiddenListBox").hide(300);
        $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
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
            let violationId = jQueryRecord.find(".violationId").data("violationid");
            let violationCode = jQueryRecord.find(".violationId").data("violationcode");
            let totalPrice = jQueryRecord.find(".violationId").data("totalprice");
            let actualPaid = jQueryRecord.find(".violationId").data("actualpaid");
            let remainingAmount = jQueryRecord.find(".violationId").data("remainingamount");
            let offenderType = jQueryRecord.find(".violationId").data("offendertype");
            let lawRoyalty = jQueryRecord.find(".violationId").data("lawroyalty");
            let totalEquipmentsPrice = jQueryRecord.find(".violationId").data("totalequipmentsprice");
            let violationPriceType = jQueryRecord.find(".violationId").data("violationpricetype");
            let printedCount = jQueryRecord.find(".violationId").data("printedcount");
            let totalInstallmentsPaidAmount = jQueryRecord.find(".violationId").data("totalinstallmentspaidamount");

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
                    pendingPayment.getViolationDetailsForPayment(
                        taskID,
                        violationId,
                        violationCode,
                        totalPrice,
                        actualPaid,
                        remainingAmount,
                        offenderType,
                        lawRoyalty,
                        totalEquipmentsPrice,
                        violationPriceType,
                        printedCount,
                        totalInstallmentsPaidAmount
                    );
                });
        });
    });

    functions.hideTargetElement(".controls", ".hiddenListBox");
};

pendingPayment.getViolationDetailsForPayment = (
    taskID,
    violationId,
    violationCode,
    totalPrice,
    actualPaid,
    remainingAmount,
    offenderType,
    lawRoyalty,
    totalEquipmentsPrice,
    violationPriceType,
    printedCount,
    totalInstallmentsPaidAmount
) => {

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
            pendingPayment.showInstallmentPaymentPopup(TaskData);
        })
        .catch((err) => {
            console.log(err);
            $(".overlay").removeClass("active");
        });
};

pendingPayment.showInstallmentPaymentPopup = (TaskData) => {
    console.log('TaskData', TaskData)
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
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);
                } else if (violationOffenderType == "Vehicle") {
                    Content = DetailsPopup.vehicleDetailsPopupContent(
                        violationData,
                        "قيد السداد"
                    );
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);

                    // Add the Vehicle Type handling
                    let VehcleType = violationData.VehicleType;
                    if (VehcleType == "عربة بمقطورة") {
                        $(".TrailerNumberBox").show();
                    } else {
                        $(".TrailerNumberBox").hide();
                    }
                } else if (violationOffenderType == "Equipment") {
                    Content = DetailsPopup.equipmentDetailsPopupContent(
                        violationData,
                        "قيد السداد"
                    );
                    printBox = `<div class="printBox" id="printJS-form">${Content}</div>`;
                    functions.declarePopup(["generalPopupStyle", "detailsPopup"], printBox);
                }

                // Add the print functionality
                $(".printBtn").on("click", (e) => {
                    functions.PrintDetails(e);
                });

                if (print) {
                    functions.PrintDetails(event);
                }

                // Add the class to identify this popup
                $(".detailsPopupForm").addClass("pendingPayment");
            } else {
                violationData = null;
            }
        })
        .catch((err) => {
            console.log(err);
        });
};

pendingPayment.filterPaymentsLog = () => {
    let ViolationSector = Number($("#violationSector").val() || 0);
    let ViolationType = Number($("#TypeofViolation option:selected").data("id") || 0);
    let GlobalSearch = $("#violationSearch").val();

    $(".PreLoader").addClass("active");
    pagination.reset();

    pendingPayment.getPendingPayment(
        1,
        true,
        ViolationSector,
        ViolationType,
        GlobalSearch
    );
};

pendingPayment.resetFilter = (e) => {
    e.preventDefault();
    $("#nationalID").val("");
    $("#violatorName").val("");
    $("#violationCode").val("");
    $("#violationSector").val("0");
    $("#violationCategory").val("");
    $("#TypeofViolation").val("0");
    $("#violationZone").val("");
    $("#violationSearch").val("");
    $("#createdFrom").val("");
    $("#createdTo").val("");
    $("#theCode").val("");

    $(".PreLoader").addClass("active");
    pagination.reset();
    pendingPayment.getPendingPayment();
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