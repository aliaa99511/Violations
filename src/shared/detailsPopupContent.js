import functions from "./functions";

let DetailsPopup = {};

DetailsPopup.quarryDetailsPopupContent = (violationData, LogName) => {
  console.log(violationData);
  $(".overlay").removeClass("active");
  let violationDate = functions.getFormatedDate(violationData.ViolationDate);
  let violationTime = functions.getFormatedDate(
    violationData.ViolationTime,
    "hh:mm A"
  );
  let Equipments = DetailsPopup.getViolationEquipments(
    violationData.Equipments,
    violationData.OffenderType
  );
  let Coordinates = DetailsPopup.getViolationCoords(
    violationData.CoordinatesDegrees
  );
  DetailsPopup.getViolationAttachmentsById(violationData.ID);
  let CommitteeRecorder = DetailsPopup.getCommitteeRecorder(
    violationData.Sector
  );
  let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode"> 
                <p>مخالفة المحجر رقم ${violationData.ViolationCode}</p>
                <div class="printBtn"><img src="${
                  functions.getSiteName() == "ViolationsBranch"
                    ? "/Style Library/MiningViolations/images/GreenPrintBtn.png"
                    : "/Style Library/MiningViolations/images/BluePrintBtn.png"
                }" alt="Print Button"></div>
            </div>
            <div class="backBtn">
                <div class="bootpopup-button close" data-dismiss="modal" aria-label="Close">
                   <a href="#!"> العودة إلى سجل المخالفات ${LogName} <i class="fa-solid fa-angle-left"></i></a>
                </div>
            </div>
        </div>
        <div class="popupFormBoxHeader">
            <p class="formBoxTitle"><span class="formNumber">1</span> تفاصيل المخالفة</p>
        </div>
        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">
                <div class="formContent">
  
                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violatorName" class="customLabel">اسم المخالف</label>
                                        <input class="form-control customInput violatorName" id="violatorName" type="text" value="${
                                          violationData.ViolatorName
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violatorNationalId" class="customLabel">الرقم القومي للمخالف</label>
                                        <input class="form-control customInput violatorNationalId" id="violatorNationalId" type="text" value="${
                                          violationData.NationalID
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationGov" class="customLabel">المحافظة</label>
                                        <input class="form-control customInput violationGov" id="violationGov" type="text" value="${
                                          violationData.Governrates != null
                                            ? violationData.Governrates.Title
                                            : "-"
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationArea" class="customLabel">منطقة الضبط</label>
                                        <input class="form-control customInput violationArea" id="violationArea" type="text" value="${
                                          violationData.ViolationsZone
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="companyName" class="customLabel">الشركة المخالفة التابع لها</label>
                                        <input class="form-control customInput companyName" id="companyName" type="text" value="${
                                          violationData.ViolatorCompany
                                        }" disabled>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="hiddenDetailsBox">
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group customFormGroup">
                                                <label for="violationType" class="customLabel">نوع المخالفة</label>
                                                <input class="form-control customInput violationType" id="violationType" type="text" value="${
                                                  violationData.ViolationTypes !=
                                                  null
                                                    ? violationData
                                                        .ViolationTypes.Title
                                                    : "-"
                                                }" disabled>
                                            </div>
                                        </div>
                                        <div class="col-md-6 BonesBox">
                                            <div class="form-group customFormGroup">
                                                <label for="bonesCount" class="customLabel">عدد البونات</label>
                                                <input class="form-control customInput bonesCount" id="bonesCount" type="text" value="${
                                                  violationData.BonsNumber
                                                }" disabled>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group customFormGroup">
                                                <label for="violationRawType" class="customLabel">نوع الخام</label>
                                                <input class="form-control customInput violationRawType" id="violationRawType" type="text" value="${
                                                  violationData.Material != null
                                                    ? violationData.Material
                                                        .Title
                                                    : "-"
                                                }" disabled>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group customFormGroup">
                                                <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                                                <div class="inputIconBox">
                                                    <input class="form-control customInput inputDate violationDate"
                                                        id="violationDate" type="text" value="${violationDate}" disabled>
                                                    <i class="fa-solid fa-calendar-days"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group customFormGroup">
                                                <label for="violationTime" class="customLabel">وقت الضبط</label>
                                                <div class="inputIconBox">
                                                    <input class="form-control customInput timeInput violationTime" id="violationTime" type="text" value="${violationTime}" disabled>
                                                    <i class="fa-solid fa-clock"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group customFormGroup">
                                                <label for="quarryType" class="customLabel">نوع المحجر</label>
                                                <input class="form-control customInput quarryType" id="quarryType" type="text" value="${
                                                  violationData.QuarryType
                                                }" disabled>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group customFormGroup">
                                                <label for="quarryCode" class="customLabel">رقم المحجر</label>
                                                <input class="form-control customInput quarryCode" id="quarryCode" type="text" value="${
                                                  violationData.QuarryCode != ""
                                                    ? violationData.QuarryCode
                                                    : "-"
                                                }" disabled>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="form-group customFormGroup">
                                                <label class="customLabel">ضبط معدات</label>
                                                ${Equipments}
                                            </div>
                                        </div>
                                </div>
                            </div>
                        </div>
    
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label for="violationDepth" class="customLabel">العمق/الإرتفاع</label>
                                                <span>بالمتر</span>
                                            </div>
                                            <input class="form-control customInput violationDepth" id="violationDepth" type="text" value="${
                                              violationData.Depth
                                            }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label for="AreaSpace" class="customLabel">مساحة المحجر</label>
                                                <span>بالمتر المربع</span>
                                            </div>
                                            <input class="form-control customInput AreaSpace" id="AreaSpace" type="text" value="${
                                              violationData.Area
                                            }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label for="distanceToNearQuarry" class="customLabel">المسافة لأقرب محجر</label>
                                                <span>كيلو متر</span>
                                            </div>
                                            <input class="form-control customInput distanceToNearQuarry"
                                                id="distanceToNearQuarry" type="text" value="${
                                                  violationData.DistanceToNearestQuarry
                                                }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label class="customLabel">الإحداثيات</label>
                                                <a href="#!" class="titleLink showOnMapBtn"><i class="fa-solid fa-map-pin"></i> عرض على الخريطة</a>
                                            </div>
                                            <div class="coordinatesTable" id="coordinatesTable">
                                                ${Coordinates}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-8">
                                        <div class="feildInfoBox">
                                            <label class="customLabel">المرفقات</label>
                                            <a href="#!" class="titleLink downloadAllFiles">
                                            <i class="fa-solid fa-download"></i> تنزيل الكل</a>
                                        </div>
                                        <div class="attachBox"></div>
                                    </div>
                                    <div class="col-md-4">  
                                        <div class="form-group customFormGroup">
                                            <label for="violationDescription" class="customLabel">وصف المخالفة</label>
                                            <textarea class="form-control violationDescription customTextArea" id="violationDescription" value="${
                                              violationData.Description
                                            }" disabled>${
    violationData.Description
  }</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label for="sectorManegrOpinion" class="customLabel">رأي قائد القطاع</label>
                                            <textarea class="form-control sectorManegrOpinion customTextArea" id="sectorManegrOpinion" value="${
                                              violationData.LeaderOpinion
                                            }" disabled>${
    violationData.LeaderOpinion
  }</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox rejectReasonBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label for="rejectReason" class="customLabel">سبب الرفض</label>
                                            <textarea class="form-control rejectReason customTextArea" id="rejectReason" disabled></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox addConfirmationAttchBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label for="attachEditFile" class="customLabel">إرفاق مستند</label>
                                            <div class="fileBox" id="dropContainer">
                                                <div class="inputFileBox">
                                                    <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                    <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                    <input type="file" class="customInput attachFilesInput attachConfirmationFile form-control" id="attachConfirmationFile" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                                </div>
                                            </div>
                                            <div class="dropFilesArea" id="dropFilesArea"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox totalPriceBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label class="customLabel" for="totalPrice">إجمالي المبلغ المستحق</label>
                                                <a href="#!" class="titleLink showFormula"> تفاصيل حساب المبلغ المستحق</a>
                                            </div>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput ${
                                                  functions.getSiteName() ==
                                                  "ViolationsBranch"
                                                    ? "greenInput"
                                                    : "blueInput"
                                                } totalPrice" id="totalPrice" type="text" value="${functions.splitBigNumbersByComma(
    violationData.TotalPriceDue
  )}" disabled>
                                                <span>جنيها</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 dateLimitBox">
                                        <div class="form-group customFormGroup">
                                            <label class="customLabel">تاريخ مدة نهاية التصالح</label>
                                            <input class="form-control customInput greenInput violationEndTime" id="violationEndTime" type="text" disabled>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox confirmationAttachBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <label class="customLabel">المرفقات / مستندات التصديق</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="showMoreDetails">
                        <div class="moreDetailsInnerBox">
                            <img src="/Style Library/MiningViolations/images/arrowDown.png" alt="Arrow Down">
                            <p>إظهار المزيد من التفاصيل</p>
                        </div>
                    </div>
                </div>              
  
                <div class="formButtonsBox">
                    <div class="row">
                        <div class="col-12">
                            <div class="buttonsBox centerButtonsBox ">
                                <div class="btnStyle confirmBtnGreen popupBtn printPaymentForm" id="printPaymentForm">طباعة نموذج السداد</div>
                                <div class="btnStyle cancelBtn popupBtn payPartPrice" id="payPartPrice">تسديد المخالفة</div>
                                <div class="btnStyle confirmBtnGreen popupBtn payAllPrice" id="payAllPrice">تسديد وإنهاء المخالفة </div>
                                <div class="btnStyle confirmBtn popupBtn confirmViolation" id="confirmViolation">التصديق على المخالفة </div>
                                <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إغلاق</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="popupFormBoxHeader">
            <p class="formBoxTitle"><span class="formNumber">2</span> تسديد المخالفة</p>
        </div>
    `;
  return popupHtml;
};

{
  /* <div class="formBox CommiteeMembersBox">
    <div class="formElements">
        <div class="row">
            
        </div>
    </div>
</div> */
}
DetailsPopup.vehicleDetailsPopupContent = (violationData, LogName) => {
  $(".overlay").removeClass("active");
  let violationDate = functions.getFormatedDate(violationData.ViolationDate);
  let violationTime = functions.getFormatedDate(
    violationData.ViolationTime,
    "hh:mm A"
  );
  let Equipments = DetailsPopup.getViolationEquipments(
    violationData.Equipments,
    violationData.OffenderType
  );
  let Coordinates = DetailsPopup.getViolationCoords(
    violationData.CoordinatesDegrees
  );
  DetailsPopup.getViolationAttachmentsById(violationData.ID);
  let popupHtml = `
        <div class="popupHeader">
            <div class="violationsCode">
                <p>مخالفة العربة رقم ${violationData.ViolationCode}</p>
                <div class="printBtn"><img src="${
                  functions.getSiteName() == "ViolationsBranch"
                    ? "/Style Library/MiningViolations/images/GreenPrintBtn.png"
                    : "/Style Library/MiningViolations/images/BluePrintBtn.png"
                }" alt="Print Button"></div>
            </div>
            <div class="backBtn">
                <div class="bootpopup-button close" data-dismiss="modal" aria-label="Close">
                    <a href="#!"> العودة إلى سجل المخالفات ${LogName} <i class="fa-solid fa-angle-left"></i></a>
                </div>
            </div>
        </div>

        <div class="popupFormBoxHeader">
            <p class="formBoxTitle"><span class="formNumber">1</span> تفاصيل المخالفة</p>
        </div>

        <div class="popupBody">
            <div class="popupForm detailsPopupForm" id="detailsPopupForm">

                <div class="formContent">

                    <div class="formBox">
                        <div class="formElements">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violatorName" class="customLabel">اسم المخالف</label>
                                        <input class="form-control customInput violatorName" id="violatorName" type="text" value="${
                                          violationData.ViolatorName
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violatorNationalId" class="customLabel">الرقم القومي للمخالف</label>
                                        <input class="form-control customInput violatorNationalId" id="violatorNationalId" type="text" value="${
                                          violationData.NationalID
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationGov" class="customLabel">المحافظة</label>
                                        <input class="form-control customInput violationGov" id="violationGov" type="text" value="${
                                          violationData.Governrates != null
                                            ? violationData.Governrates.Title
                                            : "-"
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationArea" class="customLabel">منطقة الضبط</label>
                                        <input class="form-control customInput violationArea" id="violationArea" type="text" value="${
                                          violationData.ViolationsZone
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="companyName" class="customLabel">الشركة المخالفة التابع لها</label>
                                        <input class="form-control customInput companyName" id="companyName" type="text" value="${
                                          violationData.ViolatorCompany
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="violationCarType" class="customLabel">نوع العربة</label>
                                        <input class="form-control customInput violationCarType" id="violationCarType" type="text" value="${
                                          violationData.VehicleType
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-6 TrailerNumberBox">
                                    <div class="form-group customFormGroup">
                                        <label for="tractorNumber" class="customLabel">رقم المقطورة</label>
                                        <input class="form-control customInput tractorNumber" id="tractorNumber" type="text" value="${
                                          violationData.TrailerNum
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <p class="formSectionLabel ${
                                      functions.getSiteName() ==
                                      "ViolationsBranch"
                                        ? "greenSectionLabel"
                                        : "blueSectionLabel"
                                    }">* رخصة تسيير مركبة</p>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="carLicenseFullNumber" class="customLabel">رقم العربة</label>
                                        <input class="form-control customInput carLicenseFullNumber" id="carLicenseFullNumber" type="text" value="${
                                          violationData.CarNumber
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="carBrand" class="customLabel">النوع</label>
                                        <input class="form-control customInput carBrand" id="carBrand" type="text" value="${
                                          violationData.VehicleBrand
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="carLicenseColor" class="customLabel">اللون</label>
                                        <input class="form-control customInput carLicenseColor" id="carLicenseColor" type="text" value="${
                                          violationData.CarColor
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="carLicenseTraffic" class="customLabel">ترخيص المرور</label>
                                        <input class="form-control customInput carLicenseTraffic" id="carLicenseTraffic" type="text" value="${
                                          violationData.TrafficName
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <p class="formSectionLabel ${
                                      functions.getSiteName() ==
                                      "ViolationsBranch"
                                        ? "greenSectionLabel"
                                        : "blueSectionLabel"
                                    }">* رخصة القيادة</p>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group customFormGroup">
                                        <label for="driverLicenseNumber" class="customLabel">رقم رخصة القيادة</label>
                                        <input class="form-control customInput driverLicenseNumber" id="driverLicenseNumber" type="text" value="${
                                          violationData.DrivingLicense
                                        }" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group customFormGroup">
                                        <label for="driverLicenseTraffic" class="customLabel">ترخيص المرور</label>
                                        <input class="form-control customInput driverLicenseTraffic" id="driverLicenseTraffic" type="text" value="${
                                          violationData.TrafficName
                                        }" disabled>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="hiddenDetailsBox">
                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationType" class="customLabel">نوع المخالفة</label>
                                            <input class="form-control customInput violationType" id="violationType" type="text" value="${
                                              violationData.ViolationTypes !=
                                              null
                                                ? violationData.ViolationTypes
                                                    .Title
                                                : "-"
                                            }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationRawType" class="customLabel">نوع الخام</label>
                                            <input class="form-control customInput violationRawType" id="violationRawType" type="text" value="${
                                              violationData.Material != null
                                                ? violationData.Material.Title
                                                : "-"
                                            }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="RawQuantity" class="customLabel">كمية الخام</label>
                                            <input class="form-control customInput RawQuantity" id="RawQuantity" type="text" value="${
                                              violationData.MaterialAmount
                                            }" disabled>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationDate" class="customLabel">تاريخ الضبط</label>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput inputDate violationDate"
                                                    id="violationDate" type="text" value="${violationDate}" disabled>
                                                <i class="fa-solid fa-calendar-days"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <label for="violationTime" class="customLabel">وقت الضبط</label>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput timeInput violationTime" id="violationTime" type="text" value="${violationTime}" disabled>
                                                <i class="fa-solid fa-clock"></i>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label class="customLabel">ضبط معدات</label>
                                            ${Equipments}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label class="customLabel">الإحداثيات</label>
                                                <a href="#!" class="titleLink showOnMapBtn"><i class="fa-solid fa-map-pin"></i> عرض على الخريطة</a>
                                            </div>
                                            <div class="coordinatesTable" id="coordinatesTable">
                                                ${Coordinates}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-8">
                                        <div class="feildInfoBox">
                                            <label class="customLabel">المرفقات</label>
                                            <a href="#!" class="titleLink downloadAllFiles">
                                            <i class="fa-solid fa-download"></i> تنزيل الكل</a>
                                        </div>
                                        <div class="attachBox"></div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-group customFormGroup">
                                            <label for="violationDescription" class="customLabel">وصف المخالفة</label>
                                            <textarea class="form-control violationDescription customTextArea" id="violationDescription" value="${
                                              violationData.Description
                                            }" disabled>${
    violationData.Description
  }</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label for="sectorManegrOpinion" class="customLabel">رأي قائد القطاع</label>
                                            <textarea class="form-control sectorManegrOpinion customTextArea" id="sectorManegrOpinion" value="${
                                              violationData.LeaderOpinion
                                            }" disabled>${
    violationData.LeaderOpinion
  }</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox rejectReasonBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label for="rejectReason" class="customLabel">سبب الرفض</label>
                                            <textarea class="form-control rejectReason customTextArea" id="rejectReason" disabled></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox addConfirmationAttchBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group customFormGroup">
                                            <label for="attachEditFile" class="customLabel">إرفاق مستند</label>
                                            <div class="fileBox" id="dropContainer">
                                                <div class="inputFileBox">
                                                    <img src="/Style Library/MiningViolations/images/fileIcon.svg" alt="File Icon">
                                                    <p class="dragDropFilesLabel">قم بالسحب والإفلات لرفع الملف , أو <a href="#!" class="attachFileLink">استعراض ملفاتي</a></p>
                                                    <input type="file" class="customInput attachFilesInput attachConfirmationFile form-control" id="attachConfirmationFile" accept="image/gif,image/svg,image/jpg,image/jpeg,image/png,.doc,.docx,.pdf,.xls,.xlsx,.pptx" multiple>
                                                </div>
                                            </div>
                                            <div class="dropFilesArea" id="dropFilesArea"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox totalPriceBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group customFormGroup">
                                            <div class="feildInfoBox">
                                                <label class="customLabel" for="totalPrice">إجمالي المبلغ المستحق</label>
                                                <a href="#!" class="titleLink showFormula"> تفاصيل حساب المبلغ المستحق</a>
                                            </div>
                                            <div class="inputIconBox">
                                                <input class="form-control customInput ${
                                                  functions.getSiteName() ==
                                                  "ViolationsBranch"
                                                    ? "greenInput"
                                                    : "blueInput"
                                                } totalPrice" id="totalPrice" type="text" value="${functions.splitBigNumbersByComma(
    violationData.TotalPriceDue
  )}" disabled>
                                                <span>جنيها</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 dateLimitBox">
                                        <div class="form-group customFormGroup">
                                            <label class="customLabel">تاريخ مدة نهاية التصالح</label>
                                            <input class="form-control customInput greenInput violationEndTime" id="violationEndTime" type="text" disabled>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="formBox confirmationAttachBox">
                            <div class="formElements">
                                <div class="row">
                                    <div class="col-12">
                                        <label class="customLabel">المرفقات</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="showMoreDetails">
                        <div class="moreDetailsInnerBox">
                            <img src="/Style Library/MiningViolations/images/arrowDown.png" alt="Arrow Down">
                            <p>إظهار المزيد من التفاصيل</p>
                        </div>
                    </div>
                    
                </div>

                <div class="formButtonsBox">
                    <div class="col-12">
                        <div class="buttonsBox centerButtonsBox ">
                            <div class="btnStyle confirmBtnGreen popupBtn printPaymentForm" id="printPaymentForm">طباعة نموذج السداد</div>
                            <div class="btnStyle cancelBtn popupBtn payPartPrice" id="payPartPrice">تسديد المخالفة</div>
                            <div class="btnStyle confirmBtnGreen popupBtn payAllPrice" id="payAllPrice">تسديد وإنهاء المخالفة </div>
                            <div class="btnStyle confirmBtn popupBtn confirmViolation" id="confirmViolation">التصديق على المخالفة </div>
                            <div class="btnStyle cancelBtn popupBtn closeDetailsPopup" id="closeDetailsPopup" data-dismiss="modal" aria-label="Close">إغلاق</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="popupFormBoxHeader">
            <p class="formBoxTitle"><span class="formNumber">2</span> تسديد المخالفة</p>
        </div>
`;
  return popupHtml;
};

DetailsPopup.getViolationEquipments = (Equipments, OffenderType) => {
  let toolsBoxClass =
    OffenderType == "Quarry" ? "quarryToolsBox" : "carToolsBox";
  let equipmentsHtml = $(`
                           <div>
                               <div class="toolsBox ${toolsBoxClass}"></div>
                           </div>
                         `);
  if (Equipments.length > 0) {
    Equipments.forEach((Equipment) => {
      equipmentsHtml.find("." + toolsBoxClass).append(`
          <div class="tool popupTool">
              <label class="customelabel checkboxLabel" for="${Equipment.Title}">
                  <input type="checkbox" class="toolInput checkboxInput" value="${Equipment.Title}" name="${Equipment.Title}" id="${Equipment.Title}" disabled>
                  <span class="checkmark"></span>
                  <span class="checktext">${Equipment.Title}</span>
              </label>
          </div>
          `);
    });
  } else {
    equipmentsHtml.find(".quarryToolsBox").append(`
          <p class="noEquipments">لم يتم إضافة معدات مضبوطة</p>
      `);
  }
  return equipmentsHtml.html();
};
DetailsPopup.getViolationCoords = (Coordinates) => {
  let CoordsHtml = $(`
                        <div>
                            <table class="table table-bordered">
                                <tr>
                                    <th scope="col">م</th>
                                    <th scope="col">شرقيات (E)</th>
                                    <th scope="col">شماليات (N)</th>
                                    <th data-attr-ignore></th>
                                </tr>
                            </table>
                        </div>
                    `);
  if (Coordinates != null) {
    let splitedCoords = Coordinates.split("],");
    let filteredCoords;
    splitedCoords.forEach((singleCoord, index) => {
      filteredCoords = singleCoord
        .replace(/\D+/g, " ")
        .trim()
        .split(" ")
        .map((e) => parseInt(e));
      CoordsHtml.find("table").append(`
            <tr>
                <th>${index + 1}</th>
                <td>
                    <input type="text" class="" value="${
                      filteredCoords[0]
                    }" disabled>
                    <input type="text" class="" value="${
                      filteredCoords[1]
                    }" disabled>
                    <input type="text" class="" value="${
                      filteredCoords[2]
                    }" disabled>
                </td>
                <td>
                    <input type="text" class="" value="${
                      filteredCoords[3]
                    }" disabled>
                    <input type="text" class="" value="${
                      filteredCoords[4]
                    }" disabled>
                    <input type="text" class="" value="${
                      filteredCoords[5]
                    }" disabled>
                </td>
                <td></td>
            </tr>
        `);
    });
  }
  return CoordsHtml.html();
};
DetailsPopup.getViolationAttachmentsById = (violationID) => {
  let request = {
    id: violationID,
    listName: "Violations",
  };
  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Get",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify(request),
    success: (data) => {
      console.log(data);
      if (data != null) {
        let attachmentsData = data.d;
        if (attachmentsData.length > 0) {
          attachmentsData.forEach((attachData) => {
            $(".attachBox").append(`
                            <a class="attachment" target="_blanck" href="${attachData.Url}" download="${attachData.Url}" title="${attachData.Name}">
                                <div class="attachImgBox">
                                    <img src="/Style Library/MiningViolations/images/file.png" alt="attach Image">
                                </div>
                                <div class="attachDataBox">
                                    <p class="attachName">${attachData.Name}</p>
                                    <span><i class="fa-solid fa-download"></i></span>
                                </div>
                            </a>
                        `);
          });
        } else {
          $(".downloadAllFiles").hide();
          $(".attachBox").append(`
                            <p class="noAttachments">لا يوجد مرفقات</p>
                    `);
        }
      }
    },
    error: (xhr) => {
      console.log(xhr.responseText);
    },
  });
};

DetailsPopup.getConfirmationAttachments = (TaskId) => {
  let request = {
    id: TaskId,
    listName: "ViolationsCycle",
  };
  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Get",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify(request),
    success: (data) => {
      console.log("attach is :", data);
      if (data != null) {
        let attachmentsData = data.d;
        if (attachmentsData.length > 0) {
          attachmentsData.forEach((attachData) => {
            $(".confirmationAttachBox").find(".row").append(`
                            <div class="col-md-6">
                                <a class="attchedFile" target="_blanck" href="${attachData.Url}" download="${attachData.Url}" title="${attachData.Name}">
                                    <div class="attachDetailsBox">
                                        <img src="/Style Library/MiningViolations/images/smallFile.png" alt="attach Image">
                                        <p class="attchedFileName">${attachData.Name}</p>
                                    </div>
                                    <span><i class="fa-solid fa-download"></i></span>
                                </a>
                            </div>
                        `);
          });
        } else {
          $(".downloadAllFiles").hide();
          $(".confirmationAttachBox").find(".row").append(`
                        <div class="col-12">
                            <p class="noAttachedFiles">لا يوجد مرفقات</p>
                        </div>
                    `);
        }
      }
    },
    error: (xhr) => {
      console.log(xhr.responseText);
    },
  });
};

DetailsPopup.getCommitteeRecorder = (SectorId) => {
  console.log(SectorId);
  functions.callSharePointListApi("Configurations").then((Users) => {
    let UsersData = Users.value;
    console.log(UsersData);
    UsersData.forEach((User) => {
      if (User.ID == SectorId) {
        console.log(User);
      }
    });
  });
};
DetailsPopup.getCommitteeManager = (SectorId) => {};
DetailsPopup.getCommitteeMember = (SectorId) => {};

// DetailsPopup.Configurations = () => {
//   functions.callSharePointListApi("Configurations").then((Confs) => {
//     let Configurationdata = Confs.value;
//     Configurationdata.forEach((Conf) => {
//       if (Conf.JobTitle1 == "عضو اللجنة") {
//         console.log("عضو اللجنة", Conf.NameAr);
//         $(".Read").val(Conf.NameAr);
//       } else if (Conf.JobTitle1 == "قائد القطاع") {
//         console.log("قائد القطاع", Conf.NameAr);
//         $(".Contribute").val(Conf.NameAr);
//       } else if (Conf.JobTitle1 == "القائم بالضبط") {
//         $(".Edit").val(Conf.NameAr);
//         console.log("القائم بالضبط", Conf.NameAr);
//       }
//     });
//   });
// };

export default DetailsPopup;
