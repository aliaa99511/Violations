import functions from "../../Shared/functions";
import sharedApis from "../../Shared/sharedApiCall";

let externalViolationForm = {};

externalViolationForm.violatorDetails = () => {
    let vaildViolator = false;
    let violatorDetails = {};
    let violatorName = $("#violatorName").val();
    let companyName = $("#companyName").val();
    let violationGov = $("#violationGov").children("option:selected").val();
    let violationGovId = $("#violationGov").children("option:selected").data("id");
    let violationsZone = $("#violationsZone").val();
    let assignedProsecution = $("#assignedProsecution").children("option:selected").val();

    if (violatorName && violatorName.trim() !== "") {
        if (violationGov && violationGov !== "") {
            if (assignedProsecution && assignedProsecution !== "") {
                violatorDetails = {
                    violatorName: violatorName.trim(),
                    companyName: companyName && companyName.trim() !== "" ? companyName.trim() : "",
                    violationGov: violationGovId,
                    violationGovText: violationGov,
                    violationsZone: violationsZone && violationsZone.trim() !== "" ? violationsZone.trim() : "",
                    assignedProsecution: assignedProsecution,
                };
                vaildViolator = true;
            } else {
                functions.warningAlert("من فضلك قم باختيار النيابة المختصة", "#assignedProsecution");
            }
        } else {
            functions.warningAlert("من فضلك قم باختيار المحافظة", "#violationGov");
        }
    } else {
        functions.warningAlert("من فضلك قم بادخال اسم المخالف", "#violatorName");
    }

    if (vaildViolator) {
        return violatorDetails;
    } else {
        return vaildViolator;
    }
};

externalViolationForm.violationDetails = () => {
    let violationsData = {};
    let validViolation = false;
    let offenderType = $("#offenderType").children("option:selected").val();
    let offenderTypeId = $("#offenderType").children("option:selected").data("id");
    let violationType = $("#violationType").children("option:selected").val();
    let violationTypeId = $("#violationType").children("option:selected").data("id");
    let violationDate = $("#violationDate").val();
    let caseNumber = $("#caseNumber").val();

    if (offenderType && offenderType !== "") {
        if (violationType && violationType !== "") {
            if (violationDate && violationDate !== "") {
                if (caseNumber && caseNumber.trim() !== "") {
                    violationsData = {
                        offenderType: offenderType,
                        offenderTypeText: offenderType,
                        offenderTypeId: offenderTypeId,
                        violationType: violationTypeId,
                        violationTypeText: violationType,
                        violationDate: violationDate,
                        caseNumber: caseNumber.trim(),
                        rawViolationDate: violationDate
                    };
                    validViolation = true;
                } else {
                    functions.warningAlert("من فضلك قم بادخال رقم القضية", "#caseNumber");
                }
            } else {
                functions.warningAlert("من فضلك قم بتحديد تاريخ الضبط", "#violationDate");
            }
        } else {
            functions.warningAlert("من فضلك قم باختيار نوع المخالفة", "#violationType");
        }
    } else {
        functions.warningAlert("من فضلك قم باختيار تصنيف المخالفة", "#offenderType");
    }

    if (validViolation) {
        return violationsData;
    } else {
        return validViolation;
    }
};

externalViolationForm.formActions = () => {
    let numberOfDaysBefore = functions.getViolationStartDate(3);

    // Use the same date formatting function as quarryViolation
    functions.inputDateFormat(
        ".inputDate",
        numberOfDaysBefore,
        "today",
        "dd/mm/yyyy"
    );

    // Initialize datepicker with day-month-year format
    $(".inputDate").datepicker({
        dateFormat: "dd-mm-yy",
        changeMonth: true,
        changeYear: true,
        yearRange: "-100:+0",
        onSelect: function (dateText) {
            let dateParts = dateText.split("-");
            if (dateParts.length === 3) {
                let day = dateParts[0].padStart(2, '0');
                let month = dateParts[1].padStart(2, '0');
                let year = dateParts[2];
                let formattedDate = `${day}-${month}-${year}`;
                $(this).val(formattedDate);
            }
            $(this).trigger('change');
        }
    });

    // Number validation for case number
    $(".caseNumber").on("keypress", (e) => {
        return functions.isNumberKey(e);
    });

    // Form submission
    $("#submitExternalViolation").on("click", (e) => {
        externalViolationForm.validateForm(e);
    });

    // Cancel button
    $("#cancelExternalViolation").on("click", (e) => {
        window.location.href = "/ViolationsBranch/Pages/ExternalViolationLog.aspx";
    });

    let filesExtension = [
        "gif",
        "svg",
        "jpg",
        "jpeg",
        "png",
        "doc",
        "docx",
        "pdf",
        "xls",
        "xlsx",
        "pptx",
    ];
    $(".dropFilesArea").hide();

    let violationFiles;
    let countOfFiles;
    $(".attachViolationFiles").on("change", (e) => {
        violationFiles = $(e.currentTarget)[0].files;

        if (violationFiles.length > 0) {
            $(e.currentTarget)
                .parents(".fileBox")
                .siblings(".dropFilesArea")
                .show()
                .empty();
        }

        for (let i = 0; i < violationFiles.length; i++) {
            $(e.currentTarget).parents(".fileBox").siblings(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${violationFiles[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
        }
        $(".deleteFile").on("click", (event) => {
            $(event.currentTarget).val("");
            let index = $(event.currentTarget).closest(".file").index();
            $(event.currentTarget).closest(".file").remove();
            let fileBuffer = new DataTransfer();
            for (let i = 0; i < violationFiles.length; i++) {
                if (index !== i) {
                    fileBuffer.items.add(violationFiles[i]);
                }
            }
            violationFiles = fileBuffer.files;
            countOfFiles = violationFiles.length;

            if (countOfFiles == 0) {
                // $(e.currentTarget).closest(".dropFilesArea").hide()
                $(e.currentTarget)
                    .parents(".fileBox")
                    .siblings(".dropFilesArea")
                    .hide();
            }
        });
        for (let i = 0; i < violationFiles.length; i++) {
            let fileSplited = violationFiles[i].name.split(".");
            let fileExt = fileSplited[fileSplited.length - 1].toLowerCase();
            if ($.inArray(fileExt, filesExtension) == -1) {
                functions.warningAlert(
                    "من فضلك أدخل الملفات بالامتدادات المسموح بها فقط"
                );
                $(e.currentTarget)
                    .parents(".fileBox")
                    .siblings(".dropFilesArea")
                    .hide();
                // violationFiles = fileBuffer
                $(e.currentTarget).val("");
            }
        }
    });

};

externalViolationForm.getOffenderTypes = () => {
    return new Promise((resolve, reject) => {
        $("#offenderType").empty().append(`
            <option value="" disabled selected hidden>
                تصنيف المخالفة
            </option>
        `);

        sharedApis.getOffenderType("#offenderType")
            .then(() => {
                resolve();
            })
            .catch((error) => {
                console.error("Error loading offender types:", error);
                reject(error);
            });
    });
};

externalViolationForm.getViolationTypes = () => {
    return new Promise((resolve, reject) => {
        $("#violationType").empty().append(`
            <option value="" disabled selected hidden>
                نوع المخالفة
            </option>
        `);

        sharedApis.getViolationType("#violationType")
            .then(() => {
                resolve();
            })
            .catch((error) => {
                console.error("Error loading violation types:", error);
                reject(error);
            });
    });
};

externalViolationForm.getProsecutions = () => {
    return sharedApis.getProsecutions("#assignedProsecution");
};

externalViolationForm.validateForm = (e) => {
    e.preventDefault();

    $(".customInput").removeClass("error");
    $(".selectBox select").removeClass("error");

    let violatorDetails = externalViolationForm.violatorDetails();
    let violationDetails = externalViolationForm.violationDetails();

    if (violatorDetails && violationDetails) {
        const violationDateInput = $("#violationDate").val();

        // Parse the date in DD/MM/YYYY format and convert to DD-MM-YYYY
        const dateParts = violationDateInput.split("/");
        if (dateParts.length === 3) {
            const day = dateParts[0].padStart(2, '0');
            const month = dateParts[1].padStart(2, '0');
            const year = dateParts[2];

            // Format as DD-MM-YYYY (same format used in quarryViolation)
            const formattedDate = `${day}-${month}-${year}`;

            // Then convert to MM-DD-YYYY for API (same logic as quarryViolation)
            const violationDateArr = formattedDate.split("-");
            const apiDate = `${violationDateArr[1]}-${violationDateArr[0]}-${violationDateArr[2]}`;

            let offenderType = $("#offenderType").children("option:selected").val();

            const ViolationData = {
                Title: "New External Violation",
                Governrate: violatorDetails.violationGov,
                ViolationsZone: violatorDetails.violationsZone,
                ViolatorName: violatorDetails.violatorName,
                ViolatoCode: violatorDetails.violatorName,
                CaseNumber: violationDetails.caseNumber,
                AssignedProsecution: violatorDetails.assignedProsecution,
                ViolationDate: apiDate,
                OffenderType: offenderType,
                ViolatorCompany: violatorDetails.companyName || "",
                ViolationType: violationDetails.violationType,
                IsExternalRecord: true
            };

            // Add loading state and disable button like quarryViolation
            functions.disableButton(e);
            externalViolationForm.submitNewViolation(e, ViolationData);
        } else {
            // Try alternative format (in case user entered DD-MM-YYYY directly)
            const altDateParts = violationDateInput.split("-");
            if (altDateParts.length === 3) {
                const day = altDateParts[0].padStart(2, '0');
                const month = altDateParts[1].padStart(2, '0');
                const year = altDateParts[2];

                // Convert to MM-DD-YYYY for API
                const apiDate = `${month}-${day}-${year}`;

                let offenderType = $("#offenderType").children("option:selected").val();

                const ViolationData = {
                    Title: "New External Violation",
                    Governrate: violatorDetails.violationGov,
                    ViolationsZone: violatorDetails.violationsZone,
                    ViolatorName: violatorDetails.violatorName,
                    ViolatoCode: violatorDetails.violatorName,
                    CaseNumber: violationDetails.caseNumber,
                    AssignedProsecution: violatorDetails.assignedProsecution,
                    ViolationDate: apiDate,
                    OffenderType: offenderType,
                    ViolatorCompany: violatorDetails.companyName || "",
                    ViolationType: violationDetails.violationType,
                    IsExternalRecord: true
                };

                // Add loading state and disable button like quarryViolation
                functions.disableButton(e);
                externalViolationForm.submitNewViolation(e, ViolationData);
            } else {
                functions.warningAlert("تاريخ غير صحيح. استخدم الصيغة DD/MM/YYYY", "#violationDate");
            }
        }
    }
};

externalViolationForm.submitNewViolation = (e, ViolationData) => {
    // Show loading overlay like quarryViolation
    $(".overlay").addClass("active");

    const request = {
        request: {
            Data: ViolationData
        }
    };

    functions.requester(
        "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/Save",
        request
    )
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
        })
        .then(data => {
            if (data?.d?.Status) {
                const ViolationId = data.d.Result.Id;
                const files = $("#attachViolationFiles")[0].files;

                // Like quarryViolation, check if there are files to upload
                if (files?.length > 0) {
                    // Keep overlay active while uploading attachments
                    externalViolationForm.uploadAttachment(ViolationId, "Violations");
                } else {
                    $(".overlay").removeClass("active");
                    functions.sucessAlert(
                        "تم إضافة مخالفة خارجية جديدة بنجاح",
                        false,
                        "/ViolationsBranch/Pages/ExternalViolationLog.aspx"
                    );
                }
            } else {
                $(".overlay").removeClass("active");
                functions.warningAlert(data?.d?.Message || "حدث خطأ أثناء الحفظ");
            }
        })
        .catch(err => {
            $(".overlay").removeClass("active");
            console.error(err);
            functions.warningAlert("خطأ في إرسال البيانات: " + err.message);
        });
};

externalViolationForm.uploadAttachment = (NewViolationID, ListName) => {
    $(".overlay").addClass("active");
    let Data = new FormData();
    Data.append("itemId", NewViolationID);
    Data.append("listName", ListName);
    // Data.append("Method", urlParams.get("taskId") !== null ? "Edit" : "",)
    let count = 0;
    let i;
    for (i = 0; i < $("#attachViolationFiles")[0].files.length; i++) {
        Data.append("file" + i, $("#attachViolationFiles")[0].files[i]);
    }
    $.ajax({
        type: "POST",
        url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
        processData: false,
        contentType: false,
        data: Data,
        success: (data) => {
            $(".overlay").removeClass("active");
            functions.sucessAlert(
                "تم إضافة مخالفة خارجية جديدة بنجاح",
                // urlParams.get("taskId") ? "تم تعديل مخالفة خارجية بنجاح" : "تم إضافة مخالفة خارجية جديدة بنجاح",
                false,
                "/ViolationsBranch/Pages/ExternalViolationLog.aspx"
            );
        },
        error: (err) => {
            functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
            $(".overlay").removeClass("active");
            console.log(err.responseText);
        },
    });
};

// externalViolationForm.uploadAttachment = (NewViolationID, ListName) => {
//     $(".overlay").addClass("active");

//     let Data = new FormData();
//     Data.append("itemId", NewViolationID);
//     Data.append("listName", ListName);
//     Data.append("Method", "New"); // Consistent with quarryViolation

//     let files = $("#attachViolationFiles")[0].files;

//     // Add files to FormData like quarryViolation
//     for (let i = 0; i < files.length; i++) {
//         Data.append("file" + i, files[i]);
//     }

//     $.ajax({
//         type: "POST",
//         url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
//         processData: false,
//         contentType: false,
//         data: Data,
//         success: (data) => {
//             $(".overlay").removeClass("active");
//             try {
//                 let response = JSON.parse(data);
//                 if (response.d && response.d.Status) {
//                     functions.sucessAlert(
//                         "تم إضافة مخالفة خارجية جديدة بنجاح",
//                         false,
//                         "/ViolationsBranch/Pages/ExternalViolationLog.aspx"
//                     );
//                 } else {
//                     functions.warningAlert("حدث خطأ أثناء رفع الملفات");
//                 }
//             } catch (e) {
//                 functions.warningAlert("خطأ في استجابة الخادم");
//             }
//         },
//         error: (err) => {
//             $(".overlay").removeClass("active");
//             functions.warningAlert("خطأ في إرسال الملفات");
//             console.error(err.responseText);
//         }
//     });
// };

externalViolationForm.init = () => {
    $(document).ready(function () {
        externalViolationForm.formActions();
        $(".PreLoader").addClass("active");

        // Load all dropdowns in correct order
        Promise.all([
            sharedApis.getGovernrates("#violationGov"),
            sharedApis.getOffenderType("#offenderType"),
            externalViolationForm.getViolationTypes(),
            externalViolationForm.getProsecutions()
        ])
            .then(() => {
                $(".PreLoader").removeClass("active");
            })
            .catch((error) => {
                $(".PreLoader").removeClass("active");
            });
    });
};

export default externalViolationForm;