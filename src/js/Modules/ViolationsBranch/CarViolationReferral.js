import functions from "../../Shared/functions";
import pagination from "../../Shared/Pagination";

let vehicleViolationReferral = {};
vehicleViolationReferral.pageIndex = 1;
vehicleViolationReferral.destroyTable = false;

vehicleViolationReferral.getVehicleViolationReferrals = (
    pageIndex = 1,
    destroyTable = false,
    // VehicleRegistrationNumber = $("#vehicleRegistrationNumber").val(),
    // CaseStatus = $("#CaseStatus").children("option:selected").val(),
) => {
    let request = {
        Request: {
            RowsPerPage: 10,
            PageIndex: pagination.currentPage,
            ColName: "created",
            SortOrder: "desc",
            CarNumber: $("#theCode").val(),
            ViolationCode: $("#violationCode").val(),
            ViolationStatus: $("#ViolationStatus").children("option:selected").val(),
            CourtCaseNumber: $("#CourtCaseNumber").val(),
            ViolatorName: $("#TrafficName").val(),
            ViolatorCompany: $("#ViolatorCompany").val(),
            VehicleRegistrationNumber: $("#vehicleRegistrationNumber").val(),
            Status: $("#CaseStatus").children("option:selected").val(),
            OffenderType: "Vehicle",
            // OffenderType: "Equipment",
            RefferedDateFrom: $("#RefferedDateFrom").val()
                ? moment($("#RefferedDateFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
            RefferedDateTo: $("#RefferedDateTo").val()
                ? moment($("#RefferedDateTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
                : null,
        }
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Search",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            $(".PreLoader").removeClass("active");
            let Referrals = [];
            let ItemsData = data?.d?.Result;

            if (data?.d?.Result?.GridData != null) {
                if (data.d.Result?.GridData.length > 0) {
                    Array.from(data.d.Result?.GridData).forEach((element) => {
                        Referrals.push(element);
                    });
                } else {
                    Referrals = [];
                }
            }

            vehicleViolationReferral.setPaginations(ItemsData.TotalPageCount, ItemsData.RowsPerPage);
            vehicleViolationReferral.VehicleViolationReferralTable(Referrals, destroyTable);
            vehicleViolationReferral.pageIndex = ItemsData.CurrentPage;
        })
        .catch((err) => {
            console.error(err);
        });
};
vehicleViolationReferral.setPaginations = (TotalPages, RowsPerPage) => {
    pagination.draw("#paginationID", TotalPages, RowsPerPage);
    pagination.start("#paginationID", vehicleViolationReferral.getVehicleViolationReferrals);
    pagination.activateCurrentPage();
};
vehicleViolationReferral.filterVehicleViolationReferrals = (e) => {
    let pageIndex = vehicleViolationReferral.pageIndex;

    $(".PreLoader").addClass("active");
    vehicleViolationReferral.getVehicleViolationReferrals(
        pageIndex,
        true,
    );

    // let pageIndex = vehicleViolationReferral.pageIndex;

    // let VehicleRegistrationNumberVal = $("#vehicleRegistrationNumber").val();
    // let CaseStatusVal = $("#CaseStatus").children("option:selected").val();

    // let VehicleRegistrationNumber;
    // let CaseStatus;
    // if (
    //     VehicleRegistrationNumberVal == "" &&
    //     CaseStatusVal == ""
    // ) {
    //     functions.warningAlert("من فضلك قم بإدخال قيمة واحدة على الأقل من قيم البحث");
    // } else if (
    //     VehicleRegistrationNumberVal != "" ||
    //     CaseStatusVal != ""
    // ) {
    //     $(".PreLoader").addClass("active");
    //     VehicleRegistrationNumber = $("#vehicleRegistrationNumber").val();
    //     CaseStatus = $("#CaseStatus").children("option:selected").val();
    //     vehicleViolationReferral.getVehicleViolationReferrals(
    //         pageIndex,
    //         true,
    //         VehicleRegistrationNumber,
    //         CaseStatus,
    //     );
    // }
};
vehicleViolationReferral.resetFilter = (e) => {
    e.preventDefault();

    // Clear all filter inputs
    $("#vehicleRegistrationNumber").val(""); // This is the Vehicle Registration Number input
    $("#CaseStatus").val("");
    $("#RefferedDateFrom").val("");
    $("#RefferedDateTo").val("");
    $("#ViolationStatus").val("");
    $("#theCode").val("");
    $("#violationCode").val("");
    $("#CourtCaseNumber").val("");
    $("#TrafficName").val("");
    $("#ViolatorCompany").val("");

    $(".PreLoader").addClass("active");
    pagination.reset();
    vehicleViolationReferral.getVehicleViolationReferrals();
};
vehicleViolationReferral.exportToExcel = () => {
    const currentFilters = {
        RowsPerPage: 10000000,
        PageIndex: 1,
        ColName: "created",
        SortOrder: "desc",
        CarNumber: $("#theCode").val(),
        ViolationCode: $("#violationCode").val(),
        ViolationStatus: $("#ViolationStatus").children("option:selected").val(),
        CourtCaseNumber: $("#CourtCaseNumber").val(),
        ViolatorName: $("#TrafficName").val(),
        ViolatorCompany: $("#ViolatorCompany").val(),
        VehicleRegistrationNumber: $("#vehicleRegistrationNumber").val(),
        Status: $("#CaseStatus").children("option:selected").val(),
        OffenderType: "Vehicle",
        RefferedDateFrom: $("#RefferedDateFrom").val()
            ? moment($("#RefferedDateFrom").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
            : null,
        RefferedDateTo: $("#RefferedDateTo").val()
            ? moment($("#RefferedDateTo").val(), "DD-MM-YYYY").format("YYYY-MM-DD")
            : null,
    };

    const columns = [
        {
            title: "رقم المخالفة",
            render: (record) => record.ViolationCode || "-----",
        },
        {
            title: "",
            skip: true // control column
        },
        {
            title: "تاريخ القضية",
            render: (record) => functions.getFormatedDate(record.RefferedDate),
        },
        {
            title: "رقم القيد",
            data: "VehicleRegistrationNumber",
        },
        {
            title: "الرقم القضائي",
            data: "CourtCaseNumber",
        },
        {
            title: "حالة المخالفة",
            render: (record) =>
                functions.getVehicleViolationStatus(record.ViolationStatus) || "-----",
        },
        {
            title: "موقف الإحالة",
            render: (record) =>
                functions.getCaseStatus(record.Status) || "-----",
        }
    ];

    functions.exportCasesFromAPI({
        searchUrl: "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Search",
        requestData: { Request: currentFilters },
        columns,
        fileName: "سجل إحالات مخالفات المركبات.xlsx",
        sheetName: "سجل إحالات مخالفات المركبات",
        columnWidths: 25,
        rtl: true,
        dataPath: "d.Result.GridData",
        exportButtonSelector: "#exportBtn",
        tableSelector: "#VehicleViolationReferralTable"
    });
};
vehicleViolationReferral.VehicleViolationReferralTable = (Referrals, destroyTable) => {
    let data = [];

    if (vehicleViolationReferral.destroyTable || destroyTable) {
        $("#VehicleViolationReferralTable").DataTable().destroy();
    }

    if (Referrals && Referrals.length > 0) {
        Referrals.forEach((referral) => {
            let violation = referral?.Violation;
            let refferedDate = functions.getFormatedDate(referral.RefferedDate);
            let violationStatus = referral.ViolationStatus || "";
            let caseStatus = referral.Status || "";
            let referralNumber = referral.ReferralNumber || "";
            let caseNumber = referral.CaseNumber || "";
            let vehicleRegistrationNumber = referral.VehicleRegistrationNumber || "";
            let courtCaseNumber = referral.CourtCaseNumber || "";

            // Determine which actions to show based on business rules
            let hasAddRegistrationNumberAction = false;
            // let hasAddCourtCaseNumberAction = false;
            let hasPayCaseAction = false;
            let hasPayCaseAfterEditAction = false;
            let hasSaveAction = false;
            let canShowDetailsOnly = false;

            // Business Rule 1: Add Registration Number
            if (!vehicleRegistrationNumber &&
                !courtCaseNumber &&
                caseStatus == "قيد انتظار رقم القيد" &&
                violationStatus == "UnderReview") {
                hasAddRegistrationNumberAction = true;
            }

            // // Business Rule 2: Add Court Case Number
            // if (vehicleRegistrationNumber &&
            //     !courtCaseNumber &&
            //     caseStatus == "قيد انتظار الرقم القضائي" &&
            //     violationStatus == "UnderReview") {
            //     hasAddCourtCaseNumberAction = true;
            // }

            // Business Rule 4: Pay Case (تسديد القضية)
            if (
                // vehicleRegistrationNumber &&
                (caseStatus == "قيد انتظار رقم القيد" || caseStatus == "قيد انتظار الرقم القضائي") &&
                violationStatus == "UnderReview") {
                hasPayCaseAction = true;
            }

            // Business Rule 4: Pay Case After Edit (سداد على الإحالة)
            if (
                // vehicleRegistrationNumber &&
                caseStatus == "قيد انتظار الرقم القضائي" &&
                violationStatus == "UnderReview") {
                hasPayCaseAfterEditAction = true;
            }

            // Business Rule 5: Save Action (حفظ القضية)
            if (
                (caseStatus == "قيد انتظار رقم القيد" || caseStatus == "قيد انتظار الرقم القضائي") &&
                violationStatus !== "Paid") {
                hasSaveAction = true;
            }

            // Business Rule 6: Paid - show details only
            if (violationStatus == "Paid") {
                canShowDetailsOnly = true;
            }

            // Build actions menu HTML without data attributes
            let actionsMenuHTML = '';
            if (canShowDetailsOnly) {
                actionsMenuHTML = `
                <ul class='list-unstyled controlsList'>
                    <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>
                </ul>`;
            } else {
                actionsMenuHTML = `
                <ul class='list-unstyled controlsList'>
                    <li><a href="#" class="itemDetails">المزيد من التفاصيل</a></li>`;

                if (hasAddRegistrationNumberAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="addRegistrationNumberAction">إضافة رقم القيد</a></li>`;
                }

                // if (hasAddCourtCaseNumberAction) {
                //     actionsMenuHTML += `
                //     <li><a href="#" class="addCourtCaseNumberAction">إضافة الرقم القضائي</a></li>`;
                // }

                if (hasPayCaseAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="payCaseAction">سداد على نموذج التقييم</a></li>`;
                }

                if (hasPayCaseAfterEditAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="payCaseAfterEditAction">سداد على الحظر</a></li>`;
                }

                if (hasSaveAction) {
                    actionsMenuHTML += `
                    <li><a href="#" class="saveCaseAction">حفظ</a></li>`;
                }

                actionsMenuHTML += `</ul>`;
            }

            let displayViolationStatus = functions.getVehicleViolationStatus(violationStatus);

            // Prepare all data attributes in a single object
            const violationCodeData = {
                'referralid': referral.ID,
                'violationid': referral.ViolationId,
                'taskid': referral.TaskId,
                'referralstatus': referral.Status,
                'referralnumber': referral.ReferralNumber,
                'vehicleregistrationnumber': vehicleRegistrationNumber,
                'courtcasenumber': courtCaseNumber,
                'violationcode': referral.ViolationCode,
                'oldprice': referral?.TotalOldPrice || 0,
                'newprice': referral?.TotalPriceDue || 0,
                'referredamount': referral?.ReferredAmount,
                'offendertype': referral?.OffenderType,
                'casenumber': caseNumber,
                'violationstatus': violationStatus,
                'hasaddregistrationnumber': hasAddRegistrationNumberAction,
                // 'hasaddcourtcasenumber': hasAddCourtCaseNumberAction,
                'haspaycaseafteredit': hasPayCaseAfterEditAction,
                'haspaycase': hasPayCaseAction,
                'hassavecase': hasSaveAction,
                'canshowdetailsonly': canShowDetailsOnly,
                'totalprice': referral?.TotalPriceDue || 0,
                'totaloldprice': referral?.TotalOldPrice || 0,
                'courtcasenumber': courtCaseNumber
            };

            // Convert data object to data-attributes string
            const dataAttributes = Object.entries(violationCodeData)
                .map(([key, value]) => `data-${key.toLowerCase()}="${value}"`)
                .join(' ');

            data.push([
                `<div class="violationCode noWrapContent" ${dataAttributes}>
                    ${referral.ViolationCode || "-----"}
                </div>`,
                `<div class='controls'>
                    <div class='ellipsisButton'>
                        <i class='fa-solid fa-ellipsis-vertical'></i>
                    </div>
                    <div class="hiddenListBox">
                        <div class='arrow'></div>
                        ${actionsMenuHTML}
                    </div>
                </div>`,
                `<div class="refferedDate noWrapContent">${refferedDate || "-----"}</div>`,
                `<div class="vehicleRegistrationNumber">${vehicleRegistrationNumber || "-----"}</div>`,
                `<div class="courtCaseNumber">${courtCaseNumber || "-----"}</div>`,
                `<div class="violationStatus">${displayViolationStatus || "-----"}</div>`,
                `<div class="referralStatus">${functions.getCaseStatus(caseStatus)}</div>`,
                `<div class="referralAttachments caseAttachments"><a href="#!" style="color: black;">المرفقات</a></div>`,
            ]);
            // `<div class="referralStatus">${vehicleViolationReferral.getCaseStatus(caseStatus)}</div>`,

        });
    } else {
        data.push([
            `<div class="no-data">لا توجد بيانات متاحة</div>`,
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ]);
    }

    let Table = functions.tableDeclare(
        "#VehicleViolationReferralTable",
        data,
        [
            { title: "رقم المخالفة" },
            { title: "", class: "all" },
            { title: "تاريخ القضية" },
            { title: "رقم القيد" },
            { title: "الرقم القضائي" },
            { title: "حالة المخالفة" },
            { title: "موقف الإحالة" },
            { title: "المرفقات" },
        ],
        false,
        false,
        "سجل إحالات مخالفات المركبات.xlsx",
        "سجل إحالات مخالفات المركبات"
    );

    // 🔹 create column selector
    functions.createColumnSelector(Table, "#columnSelector", 'green');

    vehicleViolationReferral.destroyTable = true;

    $("#exportBtn").off("click").on("click", () => {
        vehicleViolationReferral.exportToExcel();
    });

    $(".ellipsisButton").on("click", (e) => {
        $(".hiddenListBox").hide(300);
        $(e.currentTarget).siblings(".hiddenListBox").toggle(300);
    });

    let referralsLog = Table.rows().nodes().to$();

    $.each(referralsLog, (index, record) => {
        let jQueryRecord = $(record);
        let violationCodeElement = jQueryRecord.find(".violationCode");
        let referralID = violationCodeElement.data("referralid");
        let referralNumber = violationCodeElement.data("referralnumber");
        let hiddenListBox = jQueryRecord.find(".controls").children(".hiddenListBox");

        // Attachments click handler
        jQueryRecord.find(".referralAttachments").find("a").off('click').on('click', function (e) {
            e.preventDefault();
            $(".overlay").addClass("active");
            vehicleViolationReferral.getReferralAttachmentsByReferralId(referralID, referralNumber);
        });

        // Details click handler
        jQueryRecord.find(".itemDetails").off('click').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(".overlay").addClass("active");
            vehicleViolationReferral.FindReferralById(referralID);
            $(".hiddenListBox").hide(300);
        });

        if (
            referralsLog.length > 4 &&
            hiddenListBox.height() > 110 &&
            jQueryRecord.is(":nth-last-child(-n + 4)")
        ) {
            hiddenListBox.addClass("toTopDDL");
        }
    });

    // Add Registration Number Action
    $(document).off('click', '.addRegistrationNumberAction').on('click', '.addRegistrationNumberAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let $row = $(this).closest('tr');
        let $violationCode = $row.find('.violationCode');

        let referralId = $violationCode.data('referralid');
        let violationId = $violationCode.data('violationid');
        let taskId = $violationCode.data('taskid');
        let violationCode = $violationCode.data('violationcode');

        vehicleViolationReferral.addRegistrationNumberPopup(referralId, violationId, violationCode, taskId);
        $(".hiddenListBox").hide(300);
    });

    // // Add Court Case Number Action
    // $(document).off('click', '.addCourtCaseNumberAction').on('click', '.addCourtCaseNumberAction', function (e) {
    //     e.preventDefault();
    //     e.stopPropagation();

    //     let $row = $(this).closest('tr');
    //     let $violationCode = $row.find('.violationCode');

    //     let referralId = $violationCode.data('referralid');
    //     let violationId = $violationCode.data('violationid');
    //     let taskId = $violationCode.data('taskid');
    //     let violationCode = $violationCode.data('violationcode');

    //     vehicleViolationReferral.addCourtCaseNumberPopup(referralId, violationId, violationCode, taskId);
    //     $(".hiddenListBox").hide(300);
    // });

    // Pay Case Action (تسديد القضية)
    $(document).off('click', '.payCaseAction').on('click', '.payCaseAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let $row = $(this).closest('tr');
        let $violationCode = $row.find('.violationCode');

        let referralId = $violationCode.data('referralid');
        let violationId = $violationCode.data('violationid');
        let taskId = $violationCode.data('taskid');
        let violationCode = $violationCode.data('violationcode');
        let courtCaseNumber = $violationCode.data('courtcasenumber');
        let totalPrice = $violationCode.data('totalprice');
        let oldPrice = $violationCode.data('oldprice');

        vehicleViolationReferral.payCasePopup(
            referralId,
            violationId,
            taskId,
            violationCode,
            courtCaseNumber,
            totalPrice
        );
        $(".hiddenListBox").hide(300);
    });

    // Pay Case After Edit Action
    $(document).off('click', '.payCaseAfterEditAction').on('click', '.payCaseAfterEditAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let $row = $(this).closest('tr');
        let $violationCode = $row.find('.violationCode');

        let referralId = $violationCode.data('referralid');
        let violationId = $violationCode.data('violationid');
        let taskId = $violationCode.data('taskid');
        let referralNumber = $violationCode.data('referralnumber');
        let violationCode = $violationCode.data('violationcode');
        let totalPrice = $violationCode.data('totalprice');
        // let oldPrice = $violationCode.data('oldprice');
        let referredAmount = $violationCode.data('referredamount');

        vehicleViolationReferral.payCaseAfterEditPopup(
            referralId,
            violationId,
            taskId,
            referralNumber,
            violationCode,
            totalPrice,
            // oldPrice,
            referredAmount
        );

        $(".hiddenListBox").hide(300);
    });

    // Save Case Action Handler
    $(document).off('click', '.saveCaseAction').on('click', '.saveCaseAction', function (e) {
        e.preventDefault();
        e.stopPropagation();

        let $row = $(this).closest('tr');
        let $violationCode = $row.find('.violationCode');

        let referralId = $violationCode.data('referralid');
        let violationId = $violationCode.data('violationid');
        let taskId = $violationCode.data('taskid');
        let violationCode = $violationCode.data('violationcode');
        let referralNumber = $violationCode.data('referralnumber');
        let vehicleRegistrationNumber = $violationCode.data('vehicleregistrationnumber');
        let courtCaseNumber = $violationCode.data('courtcasenumber');
        let caseStatus = $violationCode.data('referralstatus');

        // Implement save case functionality here
        console.log('Save case:', {
            referralId,
            violationId,
            taskId,
            violationCode,
            referralNumber,
            vehicleRegistrationNumber,
            courtCaseNumber,
            caseStatus
        });

        $(".hiddenListBox").hide(300);
    });

    functions.hideTargetElement(".controls", ".hiddenListBox");
};

vehicleViolationReferral.addRegistrationNumberPopup = (ReferralID, ViolationID, ViolationCode, TaskID) => {
    $(".overlay").removeClass("active");
    let popupHtml = `
        <div class="popupHeader" style="display: flex; justify-content: space-between;">
            <div class="violationsCode"> 
                <p>إضافة رقم القيد للمخالفة رقم (${ViolationCode})</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeRegistrationNumberPopup" id="closeRegistrationNumberPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
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
                                        <label for="registrationNumber" class="customLabel">رقم القيد</label>
                                        <input class="form-control customInput registrationNumber" id="registrationNumber" type="number" placeholder="أدخل رقم القيد">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="referredAmount" class="customLabel">مبلغ الحظر</label>
                                        <input class="form-control customInput referredAmount" id="referredAmount" type="text" placeholder="أدخل مبلغ الحظر">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="registrationComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea registrationComments" id="registrationComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="registrationNumberAttach" class="customLabel">إرفاق مستند رقم القيد</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput registrationNumberAttach form-control" id="registrationNumberAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                                <div class="btnStyle confirmBtnGreen popupBtn AddRegistrationNumberBtn" id="AddRegistrationNumberBtn">تأكيد</div>
                                <div class="btnStyle cancelBtn popupBtn" id="closeRegistrationNumberPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
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
    $("#closeRegistrationNumberPopup, #closeRegistrationNumberPopupFooter").on("click", function () {
        functions.closePopup();
    });

    let RegistrationNumberInput = $("#registrationNumber").val();
    let ReferralAmountInput = $("#referredAmount").val();
    let RegistrationCommentsInput = $("#registrationComments").val();
    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let request = {};

    // File attachment handling
    $("#registrationNumberAttach").on("change", (e) => {
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
                functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    // ADDED: Allow only numbers and decimal point in referredAmount
    $("#referredAmount").on("keypress", (e) => {
        return functions.isDecimalNumberKey(e);
    });

    // ADDED: Format the referred amount with commas as the user types
    $("#referredAmount").on("keyup", (e) => {
        let rawValue = $(e.currentTarget).val().replace(/\,/g, "");

        // Store the raw value for later use
        ReferralAmountInput = rawValue;

        // Format with commas for display
        if (rawValue) {
            $(e.currentTarget).val(
                rawValue.replace(/\B(?=(?:\d{3})+(?!\d))/g, ",")
            );
        }
    });
    $("#registrationNumber").on("keyup", (e) => {
        RegistrationNumberInput = $(e.currentTarget).val().trim();
    });

    $("#registrationComments").on("keyup", (e) => {
        RegistrationCommentsInput = $(e.currentTarget).val().trim();
    });

    $(".AddRegistrationNumberBtn").on("click", (e) => {
        if (RegistrationNumberInput != "") {
            if (allAttachments != null && allAttachments.length > 0) {
                request = {
                    Request: {
                        Title: "Test",
                        Comments: RegistrationCommentsInput,
                        ViolationId: ViolationID,
                        TaskId: TaskID,
                        VehicleRegistrationNumber: RegistrationNumberInput,
                        ReferredAmount: ReferralAmountInput,
                        ID: ReferralID,
                        Status: "قيد انتظار الرقم القضائي"
                    }
                };
                $(".overlay").addClass("active");
                vehicleViolationReferral.editReferralAPIResponse(
                    request,
                    ReferralID,
                    "إضافة رقم القيد",
                    "#registrationNumberAttach",
                    "تم إضافة رقم القيد"
                );
            } else {
                functions.warningAlert("من فضلك قم بإرفاق المستند المرفق برقم القيد");
            }
        } else {
            functions.warningAlert("من فضلك قم بإضافة رقم القيد بشكل صحيح");
        }
    });
};
// Add Court Case Number Popup
// vehicleViolationReferral.addCourtCaseNumberPopup = (ReferralID, ViolationID, ViolationCode, TaskID) => {
//     $(".overlay").removeClass("active");
//     let popupHtml = `
//         <div class="popupHeader">
//             <div class="violationsCode"> 
//                 <p>إضافة الرقم القضائي للمخالفة رقم (${ViolationCode})</p>
//             </div>
//         </div>
//         <div class="popupBody">
//             <div class="popupForm detailsPopupForm" id="detailsPopupForm">

//                 <div class="formContent">
//                     <div class="formBox">
//                         <div class="formElements">
//                             <div class="row">
//                                 <div class="col-md-6">
//                                     <div class="form-group customFormGroup">
//                                         <label for="courtCaseNumber" class="customLabel">الرقم القضائي</label>
//                                         <input class="form-control customInput courtCaseNumber" id="courtCaseNumber" type="text" placeholder="أدخل الرقم القضائي">
//                                     </div>
//                                 </div>
//                                 <div class="col-md-6">
//                                     <div class="form-group customFormGroup">
//                                         <label for="courtCaseComments" class="customLabel">ملاحظات</label>
//                                         <textarea class="form-control customTextArea courtCaseComments" id="courtCaseComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
//                                     </div>
//                                 </div>
//                                 <div class="col-12">
//                                     <div class="form-group customFormGroup">
//                                         <label for="courtCaseNumberAttach" class="customLabel">إرفاق مستند الرقم القضائي</label>
//                                         <div class="fileBox" id="dropContainer">
//                                             <div class="inputFileBox">
//                                                 <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
//                                                 <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
//                                                 <input type="file" class="customInput attachFilesInput courtCaseNumberAttach form-control" id="courtCaseNumberAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
//                                             </div>
//                                         </div>
//                                         <div class="dropFilesArea" id="dropFilesArea"></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="formButtonsBox">
//                     <div class="row">
//                         <div class="col-12">
//                             <div class="buttonsBox centerButtonsBox">
//                                 <div class="btnStyle confirmBtnGreen popupBtn AddCourtCaseNumberBtn" id="AddCourtCaseNumberBtn">تأكيد</div>
//                                 <div class="btnStyle cancelBtn popupBtn closeCourtCaseNumberPopup" id="closeCourtCaseNumberPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//             </div>
//         </div>`;

//     functions.declarePopup(
//         ["generalPopupStyle", "greenPopup", "editPopup"],
//         popupHtml
//     );

//     let CourtCaseNumberInput = $("#courtCaseNumber").val();
//     let CourtCaseCommentsInput = $("#courtCaseComments").val();
//     let filesExtension = [
//         "gif", "svg", "jpg", "jpeg", "png",
//         "doc", "docx", "pdf", "xls", "xlsx", "pptx"
//     ];
//     let allAttachments;
//     let countOfFiles;
//     let request = {};

//     // File attachment handling
//     $("#courtCaseNumberAttach").on("change", (e) => {
//         allAttachments = $(e.currentTarget)[0].files;
//         if (allAttachments.length > 0) {
//             $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
//         }
//         for (let i = 0; i < allAttachments.length; i++) {
//             $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
//                 <div class="file">
//                     <p class="fileName">${allAttachments[i].name}</p>
//                     <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
//                 </div>
//             `);
//         }

//         $(".deleteFile").on("click", (event) => {
//             let index = $(event.currentTarget).closest(".file").index();
//             $(event.currentTarget).closest(".file").remove();
//             let fileBuffer = new DataTransfer();
//             for (let i = 0; i < allAttachments.length; i++) {
//                 if (index !== i) {
//                     fileBuffer.items.add(allAttachments[i]);
//                 }
//             }
//             allAttachments = fileBuffer.files;
//             countOfFiles = allAttachments.length;
//             if (countOfFiles == 0) {
//                 $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
//             }
//         });

//         for (let i = 0; i < allAttachments.length; i++) {
//             let fileSplited = allAttachments[i].name.split(".");
//             let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
//             if ($.inArray(fileExt, filesExtension) == -1) {
//                 functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
//                 $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
//                 $(e.currentTarget).val("");
//             }
//         }
//     });

//     $("#courtCaseNumber").on("keyup", (e) => {
//         CourtCaseNumberInput = $(e.currentTarget).val().trim();
//     });

//     $("#courtCaseComments").on("keyup", (e) => {
//         CourtCaseCommentsInput = $(e.currentTarget).val().trim();
//     });

//     $(".AddCourtCaseNumberBtn").on("click", (e) => {
//         if (CourtCaseNumberInput != "") {
//             if (allAttachments != null && allAttachments.length > 0) {
//                 request = {
//                     Request: {
//                         Title: "تم إضافة الرقم القضائي",
//                         Comments: CourtCaseCommentsInput,
//                         ViolationId: ViolationID,
//                         TaskId: TaskID,
//                         CourtCaseNumber: CourtCaseNumberInput,
//                         ID: ReferralID,
//                         Status: "تم إضافة الرقم القضائي"
//                     }
//                 };
//                 $(".overlay").addClass("active");
//                 vehicleViolationReferral.editReferralAPIResponse(
//                     request,
//                     ReferralID,
//                     "إضافة الرقم القضائي",
//                     "#courtCaseNumberAttach",
//                     "تم إضافة الرقم القضائي"
//                 );
//             } else {
//                 functions.warningAlert("من فضلك قم بإرفاق المستند المرفق بالرقم القضائي");
//             }
//         } else {
//             functions.warningAlert("من فضلك قم بإضافة الرقم القضائي بشكل صحيح");
//         }
//     });
// };

// // Refer to Prosecutor Popup
// vehicleViolationReferral.referToProsecutorPopup = (ReferralID, ViolationID, TaskID, ViolationCode, CourtCaseNumber) => {
//     $(".overlay").removeClass("active");
//     let popupHtml = `
//         <div class="popupHeader">
//             <div class="violationsCode"> 
//                 <p>إحالة إلى المدعي العام</p>
//             </div>
//         </div>
//         <div class="popupBody">
//             <div class="popupForm detailsPopupForm" id="detailsPopupForm">

//                 <div class="formContent">
//                     <div class="formBox">
//                         <div class="formElements">
//                             <div class="row">
//                                 <div class="col-12">
//                                     <div class="confirmationMessage">
//                                         <p>هل أنت متأكد من إحالة القضية رقم (${CourtCaseNumber}) إلى المدعي العام العسكري؟</p>
//                                     </div>
//                                 </div>
//                                 <div class="col-md-12">
//                                     <div class="form-group customFormGroup">
//                                         <label for="prosecutorComments" class="customLabel">ملاحظات</label>
//                                         <textarea class="form-control customTextArea prosecutorComments" id="prosecutorComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
//                                     </div>
//                                 </div>
//                                 <div class="col-12">
//                                     <div class="form-group customFormGroup">
//                                         <label for="prosecutorAttach" class="customLabel">إرفاق مستند الإحالة</label>
//                                         <div class="fileBox" id="dropContainer">
//                                             <div class="inputFileBox">
//                                                 <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
//                                                 <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
//                                                 <input type="file" class="customInput attachFilesInput prosecutorAttach form-control" id="prosecutorAttach" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
//                                             </div>
//                                         </div>
//                                         <div class="dropFilesArea" id="dropFilesArea"></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="formButtonsBox">
//                     <div class="row">
//                         <div class="col-12">
//                             <div class="buttonsBox centerButtonsBox">
//                                 <div class="btnStyle confirmBtnGreen popupBtn confirmReferToProsecutorBtn" id="confirmReferToProsecutorBtn">تأكيد</div>
//                                 <div class="btnStyle cancelBtn popupBtn closeReferToProsecutorPopup" id="closeReferToProsecutorPopup" data-dismiss="modal" aria-label="Close">إلغاء</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//             </div>
//         </div>`;

//     functions.declarePopup(
//         ["generalPopupStyle", "greenPopup", "editPopup"],
//         popupHtml
//     );

//     let ProsecutorCommentsInput = $("#prosecutorComments").val();
//     let filesExtension = [
//         "gif", "svg", "jpg", "jpeg", "png",
//         "doc", "docx", "pdf", "xls", "xlsx", "pptx"
//     ];
//     let allAttachments;
//     let countOfFiles;
//     let request = {};

//     // File attachment handling
//     $("#prosecutorAttach").on("change", (e) => {
//         allAttachments = $(e.currentTarget)[0].files;
//         if (allAttachments.length > 0) {
//             $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").show().empty();
//         }
//         for (let i = 0; i < allAttachments.length; i++) {
//             $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
//                 <div class="file">
//                     <p class="fileName">${allAttachments[i].name}</p>
//                     <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
//                 </div>
//             `);
//         }

//         $(".deleteFile").on("click", (event) => {
//             let index = $(event.currentTarget).closest(".file").index();
//             $(event.currentTarget).closest(".file").remove();
//             let fileBuffer = new DataTransfer();
//             for (let i = 0; i < allAttachments.length; i++) {
//                 if (index !== i) {
//                     fileBuffer.items.add(allAttachments[i]);
//                 }
//             }
//             allAttachments = fileBuffer.files;
//             countOfFiles = allAttachments.length;
//             if (countOfFiles == 0) {
//                 $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
//             }
//         });

//         for (let i = 0; i < allAttachments.length; i++) {
//             let fileSplited = allAttachments[i].name.split(".");
//             let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
//             if ($.inArray(fileExt, filesExtension) == -1) {
//                 functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
//                 $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
//                 $(e.currentTarget).val("");
//             }
//         }
//     });

//     $("#prosecutorComments").on("keyup", (e) => {
//         ProsecutorCommentsInput = $(e.currentTarget).val().trim();
//     });

//     $(".confirmReferToProsecutorBtn").on("click", (e) => {
//         if (allAttachments != null && allAttachments.length > 0) {
//             request = {
//                 Request: {
//                     Title: "قيد انتظار المدعي العام العسكري",
//                     Comments: ProsecutorCommentsInput,
//                     ViolationId: ViolationID,
//                     TaskId: TaskID,
//                     ID: ReferralID,
//                     Status: "قيد انتظار المدعي العام العسكري"
//                 }
//             };
//             $(".overlay").addClass("active");
//             vehicleViolationReferral.editReferralAPIResponse(
//                 request,
//                 ReferralID,
//                 "إحالة إلى المدعي العام",
//                 "#prosecutorAttach",
//                 "تم إحالة القضية إلى المدعي العام العسكري"
//             );
//         } else {
//             functions.warningAlert("من فضلك قم بإرفاق مستند الإحالة");
//         }
//     });
// };

// Pay Case Popup (تسديد القضية)
vehicleViolationReferral.payCasePopup = (
    ReferralID,
    ViolationID,
    TaskID,
    violationCode,
    courtCaseNumber,
    totalPrice
) => {
    $(".overlay").removeClass("active");
    let popupHtml = `
        <div class="popupHeader" style="display: flex; justify-content: space-between;">
            <div class="violationsCode"> 
                <p>تسديد القضية</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closePayCasePopup" id="closePayCasePopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
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
                                        <label for="violationCasePrice" class="customLabel">المبلغ المطلوب سداده</label>
                                        <input class="form-control disabled customInput violationCasePrice" id="violationCasePrice" type="text" value="${functions.splitBigNumbersByComma(totalPrice)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="payCaseComments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea payCaseComments" id="payCaseComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group customFormGroup">
                                        <label for="payCaseAttachment" class="customLabel">إرفاق إيصال السداد</label>
                                        <div class="fileBox" id="dropContainer">
                                            <div class="inputFileBox">
                                                <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                <input type="file" class="customInput attachFilesInput payCaseAttachment form-control" id="payCaseAttachment" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
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
                                <div class="btnStyle confirmBtnGreen popupBtn payCaseBtn" id="payCaseBtn">تأكيد السداد</div>
                                <div class="btnStyle cancelBtn popupBtn" id="closePayCasePopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
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
    $("#closePayCasePopup, #closePayCasePopupFooter").on("click", function () {
        functions.closePopup();
    });

    let filesExtension = [
        "gif", "svg", "jpg", "jpeg", "png",
        "doc", "docx", "pdf", "xls", "xlsx", "pptx"
    ];
    let allAttachments;
    let countOfFiles;
    let PayCaseCommentsInput = "";

    // File attachment handling
    $("#payCaseAttachment").on("change", (e) => {
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
                functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
                $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
                $(e.currentTarget).val("");
            }
        }
    });

    $("#payCaseComments").on("keyup", (e) => {
        PayCaseCommentsInput = $(e.currentTarget).val().trim();
    });

    $(".payCaseBtn").on("click", (e) => {
        if (allAttachments != null && allAttachments.length > 0) {
            $(".overlay").addClass("active");

            // Calculate actual amount paid (remove commas for calculation)
            let actualAmountPaid = totalPrice.toString().replace(/\,/g, "");

            // Call changeTaskStatusAfterPayCase with the correct parameters
            vehicleViolationReferral.changeTaskStatusAfterPayCase(
                TaskID,
                ViolationID,
                "#payCaseAttachment",
                parseFloat(actualAmountPaid)  // Only pass TaskID, ViolationID, attachInput, and ActualAmountPaid
            );

        } else {
            functions.warningAlert("من فضلك قم بإرفاق إيصال السداد");
        }
    });
};

vehicleViolationReferral.payCaseAfterEditPopup = (
    ReferralID,
    ViolationID,
    TaskID,
    referralNumber,
    violationCode,
    totalPrice,
    referredAmount
) => {
    $(".overlay").removeClass("active");

    // State management
    let popupState = {
        courtCaseNumber: "",
        courtCaseComments: "",
        attachments: null,
        referralID: ReferralID,
        violationID: ViolationID,
        taskID: TaskID,
        referredAmount: referredAmount,
        totalPrice: totalPrice,
        filesExtension: ["gif", "svg", "jpg", "jpeg", "png", "doc", "docx", "pdf", "xls", "xlsx", "pptx"]
    };

    // Render popup HTML
    renderPopup();

    // Setup event handlers
    setupEventHandlers();

    function renderPopup() {
        let popupHtml = `
            <div class="popupHeader" style="display: flex; justify-content: space-between;">
                <div class="violationsCode"> 
                    <p>سداد على الحظر - الإحالة رقم (${violationCode})</p>
                </div>
                <div class="btnStyle cancelBtn popupBtn closePayCaseAfterEditPopup" id="closePayCaseAfterEditPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                    <i class="fa-solid fa-x"></i>
                </div>
            </div>
            <div class="popupBody">
                <div class="popupForm detailsPopupForm" id="detailsPopupForm">
                    <div class="formContent">
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="form-group customFormGroup">
                                            <label for="violationOldPrice" class="customLabel">مبلغ المخالفة</label>
                                            <input class="form-control disabled customInput violationOldPrice" id="violationOldPrice" type="text" value="${functions.splitBigNumbersByComma(totalPrice)}" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-group customFormGroup">
                                            <label for="referredAmountValue" class="customLabel">مبلغ الإحالة</label>
                                            <input class="form-control disabled customInput referredAmountValue" id="referredAmountValue" type="text" value="${functions.splitBigNumbersByComma(referredAmount)}" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-group customFormGroup">
                                            <label for="courtCaseNumber" class="customLabel">الرقم القضائي</label>
                                            <input class="form-control customInput courtCaseNumber" id="courtCaseNumber" type="number" placeholder="أدخل الرقم القضائي">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="payCaseAfterEditAttachment" class="customLabel">إرفاق مستند الرقم القضائي</label>
                                            <div class="fileBox" id="dropContainer">
                                                <div class="inputFileBox">
                                                    <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                    <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                    <input type="file" class="customInput attachFilesInput payCaseAfterEditAttachment form-control" id="payCaseAfterEditAttachment" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                                </div>
                                            </div>
                                            <div class="dropFilesArea" id="dropFilesArea"></div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="courtCaseComments" class="customLabel">ملاحظات</label>
                                            <textarea class="form-control customTextArea courtCaseComments" id="courtCaseComments" rows="3" placeholder="أدخل الملاحظات"></textarea>
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
                                    <div class="btnStyle confirmBtnGreen popupBtn payCaseAfterEditBtn" id="payCaseAfterEditBtn">سداد على الحظر</div>
                                    <div class="btnStyle cancelBtn popupBtn" id="closePayCaseAfterEditPopupFooter" data-dismiss="modal" aria-label="Close">إلغاء</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        functions.declarePopup(["generalPopupStyle", "greenPopup", "editPopup"], popupHtml);

        // Add close button handlers
        $("#closePayCaseAfterEditPopup, #closePayCaseAfterEditPopupFooter").on("click", function () {
            functions.closePopup();
        });
    }

    function setupEventHandlers() {
        // Court case number input handler
        $("#courtCaseNumber").on("keyup", (e) => {
            popupState.courtCaseNumber = $(e.currentTarget).val().trim();
        });

        // Comments input handler
        $("#courtCaseComments").on("keyup", (e) => {
            popupState.courtCaseComments = $(e.currentTarget).val().trim();
        });

        // File attachment handler
        $("#payCaseAfterEditAttachment").on("change", handleFileAttachment);

        // Submit button handler
        $(".payCaseAfterEditBtn").on("click", handleSubmit);
    }

    function handleFileAttachment(e) {
        popupState.attachments = $(e.currentTarget)[0].files;
        const $fileBox = $(e.currentTarget).parents(".fileBox");
        const $dropFilesArea = $fileBox.siblings(".dropFilesArea");

        if (popupState.attachments.length > 0) {
            $dropFilesArea.show().empty();
        }

        // Validate file extensions
        let invalidFiles = false;
        for (let i = 0; i < popupState.attachments.length; i++) {
            const file = popupState.attachments[i];
            const fileExt = file.name.split('.').pop().toLowerCase();

            if (!popupState.filesExtension.includes(fileExt)) {
                invalidFiles = true;
                continue;
            }

            $dropFilesArea.append(`
                <div class="file" data-file-index="${i}">
                    <p class="fileName">${file.name}</p>
                    <span class="deleteFile"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }

        if (invalidFiles) {
            functions.warningAlert("من فضلك أدخل الملفات بالامتدادات المسموح بها فقط");
            $(e.currentTarget).val("");
            $dropFilesArea.hide();
            popupState.attachments = null;
            return;
        }

        // Attach delete handler to new file elements
        $(".deleteFile").off("click").on("click", handleFileDelete);
    }

    function handleFileDelete(event) {
        const $fileElement = $(event.currentTarget).closest(".file");
        const index = $fileElement.data("file-index");
        $fileElement.remove();

        // Remove file from FileList
        if (popupState.attachments && popupState.attachments.length > 0) {
            const fileBuffer = new DataTransfer();
            for (let i = 0; i < popupState.attachments.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(popupState.attachments[i]);
                }
            }
            popupState.attachments = fileBuffer.files;
        }

        // Hide drop area if no files left
        if (popupState.attachments && popupState.attachments.length === 0) {
            $(event.currentTarget).parents(".fileBox").siblings(".dropFilesArea").hide();
        }
    }

    function handleSubmit(e) {
        // Validation
        if (!popupState.courtCaseNumber) {
            functions.warningAlert("من فضلك قم بإضافة الرقم القضائي بشكل صحيح");
            return;
        }

        // if (!popupState.attachments || popupState.attachments.length === 0) {
        //     functions.warningAlert("من فضلك قم بإرفاق المستند المرفق بالرقم القضائي");
        //     return;
        // }

        $(".overlay").addClass("active");

        // Calculate actual amount paid (remove commas for calculation)
        const actualAmountPaid = parseFloat(popupState.referredAmount.toString().replace(/,/g, ""));

        // Execute operations in sequence
        executePaymentProcess(actualAmountPaid);
    }

    function executePaymentProcess(actualAmountPaid) {
        // Step 1: Update case with court case number (Cases.aspx/Save)
        updateCaseWithCourtNumber()
            .then(() => {
                // Step 2: Update task status
                return updateTaskStatus(actualAmountPaid);
            })
            .then(() => {
                // Step 3: Create referral attachment record
                return createReferralAttachmentRecord();
            })
            .then((recordId) => {
                // Step 4: Upload referral attachments (only if files exist)
                if (popupState.attachments && popupState.attachments.length > 0) {
                    return uploadReferralAttachments(recordId);
                }
            })
            .then(() => {
                // Step 5: Upload task attachments (only if files exist)
                if (popupState.attachments && popupState.attachments.length > 0) {
                    return uploadTaskAttachments();
                }
            })
            .then(() => {
                // All operations completed successfully
                $(".overlay").removeClass("active");
                functions.sucessAlert("تم السداد بنجاح");
                functions.closePopup();

                // Refresh the table
                // vehicleViolationReferral.getVehicleViolationReferrals(
                //     vehicleViolationReferral.pageIndex,
                //     true
                // );
            })
            .catch((error) => {
                console.error("Payment process failed:", error);
                $(".overlay").removeClass("active");
                functions.warningAlert(error.message || "حدث خطأ أثناء عملية السداد");
            });
    }

    function updateCaseWithCourtNumber() {
        const request = {
            Request: {
                Title: "تم الإحالة إلى المدعي العام العسكري",
                Comments: popupState.courtCaseComments || "",
                ViolationId: popupState.violationID,
                TaskId: popupState.taskID,
                CourtCaseNumber: popupState.courtCaseNumber,
                ID: popupState.referralID,
                Status: "تم الإحالة إلى المدعي العام العسكري"
            }
        };

        return functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Save", request)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to update case with court number");
                }
                return response.json();
            })
            .then(data => {
                if (!data.d || !data.d.Status) {
                    throw new Error("Case update failed");
                }
                return data;
            });
    }

    function updateTaskStatus(actualAmountPaid) {
        const request = {
            request: {
                Data: {
                    ID: popupState.taskID,
                    ViolationId: popupState.violationID,
                    ActualAmountPaid: actualAmountPaid,
                    Status: "Paid"
                }
            }
        };

        return functions.requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", request)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to update task status");
                }
                return response.json();
            })
            .then(data => {
                if (!data.d || !data.d.Status) {
                    throw new Error("Task status update failed");
                }
                return data;
            });
    }

    function createReferralAttachmentRecord() {
        const request = {
            Request: {
                Title: "New Attachment Record",
                CaseId: popupState.referralID,
                UploadPhase: "تم الإحالة إلى المدعي العام العسكري",
                Comments: popupState.courtCaseComments || "",
            }
        };

        return functions.requester("/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Save", request)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to create attachment record");
                }
                return response.json();
            })
            .then(data => {
                if (!data.d || !data.d.Status) {
                    throw new Error("Attachment record creation failed");
                }
                return data.d.Result.Id; // Return record ID for next step
            });
    }

    function uploadReferralAttachments(recordId) {
        return uploadAttachments(recordId, popupState.attachments, "CasesAttachments");
    }

    function uploadTaskAttachments() {
        return uploadAttachments(popupState.taskID, popupState.attachments, "ViolationsCycle");
    }

    function uploadAttachments(itemId, files, listName) {
        return new Promise((resolve, reject) => {
            // If no files to upload, resolve immediately
            if (!files || files.length === 0) {
                resolve({ message: "No files to upload" });
                return;
            }

            const formData = new FormData();
            formData.append("itemId", itemId);
            formData.append("listName", listName);

            // Append all files
            for (let i = 0; i < files.length; i++) {
                formData.append("file" + i, files[i]);
            }

            $.ajax({
                type: "POST",
                url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
                processData: false,
                contentType: false,
                data: formData,
                success: (data) => {
                    resolve(data);
                },
                error: (err) => {
                    reject(new Error(`Failed to upload attachments to ${listName}`));
                }
            });
        });
    }
};
vehicleViolationReferral.changeTaskStatusAfterPayCase = (TaskID, ViolationID, attachInput, ActualAmountPaid, ReferralID, Comments = "") => {
    let request = {
        request: {
            Data: {
                ID: TaskID,
                ViolationId: ViolationID,
                ActualAmountPaid: ActualAmountPaid,
                Status: "Paid"
            }
        }
    };

    functions
        .requester("/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/Save", request)
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d && data.d.Status) {
                // After successfully updating task status, upload the attachment
                vehicleViolationReferral.uploadTaskAttachment(TaskID, attachInput);
            } else {
                functions.warningAlert("حدث خطأ أثناء تحديث حالة المهمة");
                $(".overlay").removeClass("active");
            }
        })
        .catch((err) => {
            console.error("Error updating task status:", err);
            $(".overlay").removeClass("active");
            functions.warningAlert("حدث خطأ أثناء عملية السداد");
        });
};

vehicleViolationReferral.uploadTaskAttachment = (TaskId, attachInput, ListName = "ViolationsCycle") => {
    let Data = new FormData();
    Data.append("itemId", TaskId);
    Data.append("listName", ListName);

    // Use the exact same pattern as quarryViolationReferral
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
            functions.sucessAlert("تم السداد بنجاح");
            functions.closePopup();

            // Refresh the table
            vehicleViolationReferral.getVehicleViolationReferrals(
                vehicleViolationReferral.pageIndex,
                true
            );
        },
        error: (err) => {
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
            $(".overlay").removeClass("active");
            console.error(err.responseText);
        },
    });
};

vehicleViolationReferral.editReferralAPIResponse = (
    request,
    ReferralId,
    uploadPhase,
    attachInput,
    Message = ""
) => {
    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/Save",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d.Status) {
                vehicleViolationReferral.addNewReferralAttachmentRecord(
                    ReferralId,
                    uploadPhase,
                    attachInput,
                    Message
                );
            } else {
                functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
            }
        })
        .catch((err) => {
            console.error(err);
            functions.warningAlert("حدث خطأ في الاتصال بالخادم");
        });
};

vehicleViolationReferral.addNewReferralAttachmentRecord = (
    ReferralId,
    uploadPhase,
    attachInput,
    Message = "",
    Comments = ""
) => {
    let request = {
        Request: {
            Title: "New Attachment Record",
            CaseId: ReferralId,
            UploadPhase: uploadPhase,
            Comments: Comments,
        },
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Save",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            if (data.d.Status) {
                let RecordId = data.d.Result.Id;
                vehicleViolationReferral.uploadReferralAttachments(
                    RecordId,
                    attachInput,
                    "CasesAttachments",
                    Message
                );
            } else {
                functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
            }
        })
        .catch((err) => {
            console.error(err);
            functions.warningAlert("حدث خطأ في الاتصال بالخادم");
        });
};

vehicleViolationReferral.uploadReferralAttachments = (
    RecordId,
    attachInput,
    ListName,
    Message
) => {
    let Data = new FormData();
    Data.append("itemId", RecordId);
    Data.append("listName", ListName);
    for (let i = 0; i <= $(attachInput)[0].files.length; i++) {
        Data.append("file" + i, $(attachInput)[0].files[i]);
    }

    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active");
            functions.sucessAlert(Message);
            // functions.closePopup();
            // // Refresh the table
            // vehicleViolationReferral.getVehicleViolationReferrals(
            //     vehicleViolationReferral.pageIndex,
            //     true
            // );
        },
        error: (err) => {
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
            $(".overlay").removeClass("active");
        },
    });
};
///////////////////////////////////////////////////
vehicleViolationReferral.getReferralAttachmentsByReferralId = (ReferralId, referralNumber) => {
    let request = {
        Request: {
            CaseId: ReferralId,
        }
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/CaseAttachments.aspx/Search",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            let ReferralAttachmentsRecords;
            if (data.d.Status) {
                if (data.d.Result.length > 0) {
                    ReferralAttachmentsRecords = data.d.Result;
                } else {
                    ReferralAttachmentsRecords = [];
                }
                vehicleViolationReferral.referralAttachmentsDetailsPopup(
                    ReferralId,
                    referralNumber,
                    ReferralAttachmentsRecords
                );
            }
        })
        .catch((err) => {
            console.error(err);
            functions.warningAlert("هناك خطأ في إرسال بيانات الطلب");
        });
};

vehicleViolationReferral.referralAttachmentsDetailsPopup = (
    ReferralId,
    referralNumber,
    ReferralAttachmentsRecords
) => {
    let popupHtml = `
        <div class="popupHeader attachPopup" style="display: flex; justify-content: space-between;">
            <div class="violationsCode"> 
                <p>مرفقات الإحالة رقم (${referralNumber || "-----"})</p>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeReferralAttachPopup" id="closeReferralAttachPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div> 
        <div class="popupBody">
            <div class="popupTableBox">
                <table id="referralAttachmentsTable" class="table tableWithIcons popupTable"></table>
            </div>
            <div class="formButtonsBox">
                <div class="row">
                    <div class="col-12">
                        <div class="buttonsBox centerButtonsBox">
                            <div class="btnStyle cancelBtn popupBtn closeReferralAttachPopupFooter" id="closeReferralAttachPopupFooter" data-dismiss="modal" aria-label="Close">إغلاق</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    functions.declarePopup(
        ["generalPopupStyle", "greenPopup", "editPopup", "attachPopup"],
        popupHtml
    );

    vehicleViolationReferral.drawReferralAttachmentsPopupTable(
        "#referralAttachmentsTable",
        ReferralAttachmentsRecords
    );

    // Add close button handlers
    $("#closeReferralAttachPopup, #closeReferralAttachPopupFooter").on("click", function () {
        functions.closePopup();
    });
};

vehicleViolationReferral.drawReferralAttachmentsPopupTable = (
    TableId,
    ReferralAttachmentsRecords
) => {
    $(".overlay").removeClass("active");
    let data = [];
    let counter = 1;

    if (ReferralAttachmentsRecords.length > 0) {
        ReferralAttachmentsRecords.forEach((attchRecord) => {
            let attachedFilesData = attchRecord.Attachments;
            data.push([
                `<div class="attachCount">${counter}</div>`,
                `<div class="attachFiles" data-fileslength="${attachedFilesData.length}">
                    ${vehicleViolationReferral.drawAttachmentsInTable(attachedFilesData)}
                </div>`,
                `<div class="attachUploadPhase">${attchRecord.UploadPhase}</div>`,
                `<div class="attachUploadDate">${functions.getFormatedDate(
                    attchRecord.Created,
                    "DD-MM-YYYY hh:mm A"
                )}</div>`,
                `<div class="attachComments">${attchRecord.Comments != ""
                    ? attchRecord.Comments
                    : "----"
                }</div>`,
            ]);
            counter++;
        });
    }

    let Table = functions.tableDeclare(
        TableId,
        data,
        [
            { title: "م", class: "tableCounter" },
            { title: "المرفقات", class: "attachBoxHeader" },
            { title: "سبب الإرفاق" },
            { title: "تاريخ الإرفاق" },
            { title: "ملاحظات" },
        ],
        false,
        false,
        "سجل إحالات المخالفات المركبة.xlsx",
        "سجل إحالات المخالفات المركبة"
    );

    let referralAttachmentsLog = Table.rows().nodes().to$();
    $.each(referralAttachmentsLog, (index, record) => {
        let jQueryRecord = $(record);
        let attachFiles = jQueryRecord.find(".attachFiles");
        let attachFilesLength = jQueryRecord.find(".attachFiles").data("fileslength");

        if (attachFilesLength == 1) {
            attachFiles.find(".attchedFile").addClass("singleFile");
        }
        if (attachFilesLength == 2) {
            attachFiles.find(".attchedFile").addClass("multibleFiles");
        }
        if (attachFilesLength >= 3) {
            attachFiles.find(".attchedFile").addClass("manyFiles");
        }
    });
};

vehicleViolationReferral.drawAttachmentsInTable = (Attachments) => {
    let attachmentsBox = ``;

    if (Attachments.length > 0) {
        Attachments.forEach((attachment) => {
            attachmentsBox += `
                <a class="attchedFile" target="_blank" href="${attachment.Url}" download="${attachment.Name}" title="${attachment.Name}">
                    <div class="attachDetailsBox">
                        <p class="attchedFileName">${attachment.Name}</p>
                    </div>
                    <span><i class="fa-solid fa-download"></i></span>
                </a>
            `;
        });
    } else {
        attachmentsBox = `<p class="noAttachedFiles">لا يوجد مرفقات</p>`;
    }
    return attachmentsBox;
};

vehicleViolationReferral.FindReferralById = (ReferralID, popupType = "") => {
    let request = {
        Id: ReferralID,
    };

    functions
        .requester(
            "/_layouts/15/Uranium.Violations.SharePoint/Cases.aspx/FindById",
            request
        )
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
        })
        .then((data) => {
            let referralData;
            let Content;

            if (data != null) {
                referralData = data.d.Result;
                // // Fix: Ensure Equipments exists
                // if (referralData.Violation && !referralData.Violation.Equipments) {
                //     referralData.Violation.Equipments = [];
                // }

                // Create a popup with both violation details and referral/case details
                $(".overlay").removeClass("active");

                // Build the popup HTML similar to quarryViolationReferral.getReferralDetails
                Content = vehicleViolationReferral.getReferralDetails(referralData);

                functions.declarePopup(
                    ["generalPopupStyle", "greenPopup", "caseDetailsPopup"],
                    Content
                );

                // Add print functionality
                $(".printBtn").on("click", (e) => {
                    functions.PrintDetails(e);
                });

                // Add close button functionality
                $(".closeReferralDetailsPopup, .closeDetailsPopup").on("click", function () {
                    functions.closePopup();
                });
            } else {
                referralData = null;
                functions.warningAlert("لا توجد بيانات للإحالة المطلوبة");
            }
        })
        .catch((err) => {
            console.error(err);
            $(".overlay").removeClass("active");
            functions.warningAlert("حدث خطأ في جلب تفاصيل الإحالة");
        });
};

///////////////////////////////////////////
vehicleViolationReferral.getReferralDetails = (referralData) => {
    let violation = referralData.Violation;
    let violationOffenderType = referralData?.OffenderType || "Vehicle";
    let popupTitle;

    if (referralData.ReferralNumber) {
        popupTitle = `تفاصيل الإحالة رقم (${referralData.ReferralNumber})`;
    } else {
        popupTitle = `تفاصيل الإحالة عن المخالفة رقم (${referralData.ViolationCode})`;
    }

    let popupHtml = `
<div class="caseDetialsPrintBox" id="printJS-form">
    <div class="popupHeader">
        <div class="popupTitleBox">
            <div class="CaseNumberBox">
                <p class="caseNumber">${popupTitle}</p>  
                <div class="printBtn"><img src="/Style Library/MiningViolations/images/WhitePrintBtn.png" alt="Print Button"></div>
            </div>
            <div class="btnStyle cancelBtn popupBtn closeReferralDetailsPopup" id="closeReferralDetailsPopup" style="color: #fff; cursor: pointer;" data-dismiss="modal" aria-label="Close">
                <i class="fa-solid fa-x"></i>
            </div>
        </div> 
    </div>
    <div class="popupBody" style="overflow-y: auto; max-height: 80vh;"> <!-- Added inline styles -->
        <div class="popupForm detailsPopupForm" id="detailsPopupForm">
                <div class="formContent">
                    <div class="formBox">
                        <div class="formBoxHeader">
                            <p class="formBoxTitle"><span class="formNumber">1</span> تفاصيل الإحالة</p>
                        </div>
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="referralNumber" class="customLabel">رقم الإحالة</label>
                                        <input class="form-control customInput referralNumber" id="referralNumber" type="text" value="${referralData.ReferralNumber || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="vehicleRegistrationNumber" class="customLabel">رقم القيد</label>
                                        <input class="form-control customInput vehicleRegistrationNumber" id="vehicleRegistrationNumber" type="text" value="${referralData.VehicleRegistrationNumber || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="courtCaseNumber" class="customLabel">الرقم القضائي</label>
                                        <input class="form-control customInput courtCaseNumber" id="courtCaseNumber" type="text" value="${referralData.CourtCaseNumber || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="refferedDate" class="customLabel">تاريخ الإحالة</label>
                                        <input class="form-control customInput refferedDate" id="refferedDate" type="text" value="${functions.getFormatedDate(referralData.RefferedDate)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="referralStatus" class="customLabel">حالة الإحالة</label>
                                        <input class="form-control customInput referralStatus" id="referralStatus" type="text" value="${referralData.Status || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="violationStatus" class="customLabel">حالة المخالفة</label>
                                        <input class="form-control customInput violationStatus" id="violationStatus" type="text" value="${functions.getViolationStatusText(referralData.ViolationStatus)}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="caseNumber" class="customLabel">رقم القضية</label>
                                        <input class="form-control customInput caseNumber" id="caseNumber" type="text" value="${referralData.CaseNumber || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group customFormGroup">
                                        <label for="taskId" class="customLabel">رقم المهمة</label>
                                        <input class="form-control customInput taskId" id="taskId" type="text" value="${referralData.TaskId || "----"}" disabled>
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="form-group customFormGroup">
                                        <label for="comments" class="customLabel">ملاحظات</label>
                                        <textarea class="form-control customTextArea comments" id="comments" disabled>${referralData.Comments || "----"}</textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formContent">
                    <div class="formBox">
                        <div class="formBoxHeader">
                            <p class="formBoxTitle"><span class="formNumber">2</span> تفاصيل المخالفة</p>
                        </div>
                        <div class="formElements">
                            <div class="row">
                                ${violationOffenderType == "Quarry"
            ? vehicleViolationReferral.referralQuarryDetails(violation)
            : violationOffenderType == "Vehicle"
                ? vehicleViolationReferral.referralVehicleDetails(violation)
                : vehicleViolationReferral.referralEquipmentDetails(violation)
        }
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox ">
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إغلاق</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>`;

    return popupHtml;
};
vehicleViolationReferral.referralQuarryDetails = (violationData) => {
    let detailsHtml = `
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationCode" class="customLabel">رقم المخالفة</label>
                <input class="form-control customInput violationCode" id="violationCode" type="text" value="${violationData.ViolationCode || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorName" class="customLabel">اسم المخالف</label>
                <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
                <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${violationData.ViolatorCompany || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationType" class="customLabel">نوع المخالفة</label>
                <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="materialType" class="customLabel">نوع الخام</label>
                <input class="form-control customInput materialType" id="materialType" type="text" value="${violationData.Material?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationGov" class="customLabel">المحافظة</label>
                <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationZone" class="customLabel">منطقة الضبط</label>
                <input class="form-control customInput violationZone" id="violationZone" type="text" value="${violationData.ViolationsZone || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationTime" class="customLabel">وقت الضبط</label>
                <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A")}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalOldPrice" class="customLabel">المبلغ القديم</label>
                <input class="form-control customInput totalOldPrice" id="totalOldPrice" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalOldPrice || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalPriceDue" class="customLabel">المبلغ المستحق</label>
                <input class="form-control customInput totalPriceDue" id="totalPriceDue" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalPriceDue || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="quarryCode" class="customLabel">رقم المحجر</label>
                <input class="form-control customInput quarryCode" id="quarryCode" type="text" value="${violationData.QuarryCode || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="quarryType" class="customLabel">نوع المحجر</label>
                <input class="form-control customInput quarryType" id="quarryType" type="text" value="${violationData.QuarryType || "----"}" disabled>
            </div>
        </div>
    `;
    return detailsHtml;
};
vehicleViolationReferral.referralVehicleDetails = (violationData) => {
    let detailsHtml = `
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationCode" class="customLabel">رقم المخالفة</label>
                <input class="form-control customInput violationCode" id="violationCode" type="text" value="${violationData.ViolationCode || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorName" class="customLabel">اسم المخالف</label>
                <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
                <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${violationData.ViolatorCompany || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationType" class="customLabel">نوع المخالفة</label>
                <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="materialType" class="customLabel">نوع الخام</label>
                <input class="form-control customInput materialType" id="materialType" type="text" value="${violationData.Material?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationGov" class="customLabel">المحافظة</label>
                <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationZone" class="customLabel">منطقة الضبط</label>
                <input class="form-control customInput violationZone" id="violationZone" type="text" value="${violationData.ViolationsZone || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationTime" class="customLabel">وقت الضبط</label>
                <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A")}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalOldPrice" class="customLabel">المبلغ القديم</label>
                <input class="form-control customInput totalOldPrice" id="totalOldPrice" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalOldPrice || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalPriceDue" class="customLabel">المبلغ المستحق</label>
                <input class="form-control customInput totalPriceDue" id="totalPriceDue" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalPriceDue || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="carNumber" class="customLabel">رقم العربة</label>
                <input class="form-control customInput carNumber" id="carNumber" type="text" value="${violationData.CarNumber || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="vehicleType" class="customLabel">نوع العربة</label>
                <input class="form-control customInput vehicleType" id="vehicleType" type="text" value="${violationData.VehicleType || "----"}" disabled>
            </div>
        </div>
    `;
    return detailsHtml;
};
vehicleViolationReferral.referralEquipmentDetails = (violationData) => {
    let detailsHtml = `
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationCode" class="customLabel">رقم المخالفة</label>
                <input class="form-control customInput violationCode" id="violationCode" type="text" value="${violationData.ViolationCode || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorName" class="customLabel">اسم المخالف</label>
                <input class="form-control customInput violatorName" id="violatorName" type="text" value="${violationData.ViolatorName || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violatorCompany" class="customLabel">الشركة المخالفة التابع لها</label>
                <input class="form-control customInput violatorCompany" id="violatorCompany" type="text" value="${violationData.ViolatorCompany || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationType" class="customLabel">نوع المخالفة</label>
                <input class="form-control customInput violationType" id="violationType" type="text" value="${violationData.ViolationTypes?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="materialType" class="customLabel">نوع الخام</label>
                <input class="form-control customInput materialType" id="materialType" type="text" value="${violationData.Material?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationGov" class="customLabel">المحافظة</label>
                <input class="form-control customInput violationGov" id="violationGov" type="text" value="${violationData.Governrates?.Title || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationZone" class="customLabel">منطقة الضبط</label>
                <input class="form-control customInput violationZone" id="violationZone" type="text" value="${violationData.ViolationsZone || "----"}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                <input class="form-control customInput violationDate" id="violationDate" type="text" value="${functions.getFormatedDate(violationData.ViolationDate)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="violationTime" class="customLabel">وقت الضبط</label>
                <input class="form-control customInput violationTime" id="violationTime" type="text" value="${functions.getFormatedDate(violationData.ViolationTime, "hh:mm A")}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalOldPrice" class="customLabel">المبلغ القديم</label>
                <input class="form-control customInput totalOldPrice" id="totalOldPrice" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalOldPrice || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="totalPriceDue" class="customLabel">المبلغ المستحق</label>
                <input class="form-control customInput totalPriceDue" id="totalPriceDue" type="text" value="${functions.splitBigNumbersByComma(violationData.TotalPriceDue || 0)}" disabled>
            </div>
        </div>
        <div class="col-md-4">
            <div class="form-group customFormGroup">
                <label for="equipmentType" class="customLabel">نوع المعدة</label>
                <input class="form-control customInput equipmentType" id="equipmentType" type="text" value="${violationData.EquipmentType || "----"}" disabled>
            </div>
        </div>
    `;
    return detailsHtml;
};
////////////////////////////////////////////////

// // Initialization
// vehicleViolationReferral.init = () => {
//     vehicleViolationReferral.pageIndex = 1;
//     vehicleViolationReferral.dataObj.destroyTable = false;

//     // Setup event listeners
//     $(".searchBtn").off("click").on("click", vehicleViolationReferral.filterVehicleViolationReferrals);

//     // ADDED: Reset button handler
//     $(".resetBtn").off("click").on("click", vehicleViolationReferral.resetFilter);

//     $(".filterBox input").off("keypress").on("keypress", function (e) {
//         if (e.which === 13) {
//             vehicleViolationReferral.filterVehicleViolationReferrals(e);
//         }
//     });

//     // Load initial data
//     $(".PreLoader").addClass("active");
//     vehicleViolationReferral.getVehicleViolationReferrals();
// };

// $(document).ready(function () {
//     if (functions.getPageName() === "VehicleViolationReferralLog") {
//         vehicleViolationReferral.init();
//     }
// });

export default vehicleViolationReferral;