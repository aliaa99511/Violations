import Swal from "sweetalert2";
import functions from "../../Shared/functions";
import sharedApis from "../../Shared/sharedApiCall";

let carViolation = {};

carViolation.violatorDetails = () => {
  let vaildViolator = false;
  let violatorDetails = {};
  let violatorNameCheck = functions.getNameInTriple("#violatorName");
  let violatorName = $("#violatorName").val();
  let violatorNationalId = $("#violatorNationalId").val();
  let violationGov = $("#violationGov").children("option:selected").val();
  let violationGovId = $("#violationGov")
    .children("option:selected")
    .data("id");
  let violationArea = $("#violationArea").children("option:selected").val();
  let violationAreaName = $("#violationArea")
    .children("option:selected")
    .data("areaname");
  let companyName = $("#companyName").val();
  let carType = $("#violationCarType").children("option:selected").val();
  // let TractorNumber = $(".tractorBox").is(":visible") && carType == "مقطورة"?$("#tractorNumber").val():"";
  let NationalIdRegExp =
    /^(2|3)[0-9][0-9][0-1][0-9][0-3][0-9](01|02|03|04|11|12|13|14|15|16|17|18|19|21|22|23|24|25|26|27|28|29|31|32|33|34|35|88)\d\d\d\d\d$/;
  if (violatorNameCheck) {
    if (
      (violatorNationalId != "") &
      NationalIdRegExp.test(violatorNationalId)
    ) {
      if (violationGov != "") {
        if (violationArea != "") {
          if (companyName != "") {
            if (carType != "" && carType == "نقل") {
              violatorDetails = {
                violatorName: violatorName,
                violatorNationalId: violatorNationalId,
                violationGov: violationGovId,
                violationAreaCode: violationArea,
                violationAreaName: violationAreaName,
                companyName: companyName,
                carType: carType,
              };
              vaildViolator = true;
            } else if (
              carType != "" &&
              carType == "مقطورة" &&
              $(".tractorBox").is(":visible")
            ) {
              let TractorNumber = $("#tractorNumber").val();
              if (TractorNumber != "") {
                violatorDetails = {
                  violatorName: violatorName,
                  violatorNationalId: violatorNationalId,
                  violationGov: violationGovId,
                  violationAreaCode: violationArea,
                  violationAreaName: violationAreaName,
                  companyName: companyName,
                  carType: carType,
                  TractorNumber: TractorNumber,
                };
                vaildViolator = true;
              } else {
                functions.warningAlert("من فضلك قم بادخال رقم المقطورة");
              }
            } else {
              functions.warningAlert("من فضلك قم باختيار نوع العربة");
            }
          } else {
            functions.warningAlert(
              "من فضلك قم بادخال اسم الشركة التابع لها المخالف"
            );
          }
        } else {
          functions.warningAlert("من فضلك قم باختيار منطقة حدوث المخالفة");
        }
      } else {
        functions.warningAlert(
          "من فضلك قم باختيار المحافظة الواقع بها المخالفة"
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بادخال الرقم القومي بشكل صحيح مكون من 14 رقم"
      );
    }
  } else {
    functions.warningAlert("من فضلك قم بادخال اسم المخالف ثلاثي بشكل صحيح");
  }
  if (vaildViolator) {
    return violatorDetails;
  } else {
    return vaildViolator;
  }
};
carViolation.violatorCarDetails = () => {
  let LicensesData = {};
  let validLicenses = false;
  let violatorDetails = carViolation.violatorDetails();
  let carLicenseLetters = $("#carLicenseLetters").val();
  let carLicenseNumbers = $("#carLicenseNumbres").val();
  let carLicenceColor = $("#carLicenseColor").val();
  let carBrand = $("#carBrand").children("option:selected").val();
  let carLicenseTraffic = $("#carLicenseTraffic")
    .children("option:selected")
    .val();
  let driverLicenceNumber = $("#driverLicenseNumber").val();
  let driverLicenceTraffic = $("#driverLicenseTraffic")
    .children("option:selected")
    .val();
  let carLettersRegex = /[\u0600-\u06FF\u0750-\u077F]/;
  let carNumbersRegex = /^[1-9]\d*$/;
  let NationalIdRegExp =
    /^(2|3)[0-9][0-9][0-1][0-9][0-3][0-9](01|02|03|04|11|12|13|14|15|16|17|18|19|21|22|23|24|25|26|27|28|29|31|32|33|34|35|88)\d\d\d\d\d$/;
  if (violatorDetails != false) {
    if (
      carLettersRegex.test(carLicenseLetters) &&
      carLicenseLetters.length >= 3 &&
      carLicenseLetters.length <= 6
    ) {
      if (
        carNumbersRegex.test(carLicenseNumbers) &&
        carLicenseNumbers.length >= 3 &&
        carLicenseNumbers.length <= 7
      ) {
        if (carLicenceColor != "" && isNaN(carLicenceColor)) {
          if (carBrand != "") {
            if (carLicenseTraffic != "") {
              if (
                NationalIdRegExp.test(driverLicenceNumber) &&
                driverLicenceNumber != ""
              ) {
                if (driverLicenceTraffic != "") {
                  LicensesData = {
                    // carLicenseLetters:carLicenseLetters,
                    carLicenseFullNumbers:
                      carLicenseLetters + " " + carLicenseNumbers,
                    carLicenceColor: carLicenceColor,
                    carBrand: carBrand,
                    carLicenseTraffic: carLicenseTraffic,
                    driverLicenceNumber: driverLicenceNumber,
                    driverLicenceTraffic: driverLicenceTraffic,
                  };
                  validLicenses = true;
                } else {
                  functions.warningAlert(
                    "من فضلك قم باختيار المرور الذي تم استخراج الرخصه من خلاله"
                  );
                }
              } else {
                functions.warningAlert(
                  "من فضلك قم بادخال رقم رخصة السائق بشكل صحيح مكون من 14 رقم"
                );
              }
            } else {
              functions.warningAlert(
                "من فضلك قم باختيار المرور المرخص من خلاله العربة"
              );
            }
          } else {
            functions.warningAlert("من فضلك قم باختيار ماركة العربة");
          }
        } else {
          functions.warningAlert(
            "من فضلك قم بادخال لون العربة المسجل بالرخصة وبشكل صحيح"
          );
        }
      } else {
        functions.warningAlert(
          "من فضلك قم بادخال أرقام العربة لا تتجاوز 7 أرقام"
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بادخال أحرف العربة بشكل صحيح وباللغة العربية"
      );
    }
  }

  if (validLicenses) {
    return LicensesData;
  } else {
    return validLicenses;
  }
};
carViolation.violationDetails = () => {
  let violationsData = {};
  let validViolation = false;
  let violationType = $("#violationType").children("option:selected").val();
  let violationTypeId = $("#violationType")
    .children("option:selected")
    .data("id");
  let violationMaterail = $("#violationRawType")
    .children("option:selected")
    .val();
  let violationMaterailId = $("#violationRawType")
    .children("option:selected")
    .data("id");
  let violationMaterailQuantity = $("#RawQuantity")
    .children("option:selected")
    .val();
  let violationDate = $("#violationDate").val();
  let violationTimeUnformatted = $("#violationTime").val();
  let violationTimeSplited = violationTimeUnformatted.split(":");
  let violationTime =
    violationTimeSplited[0] > 12
      ? violationTimeSplited[0] - 12 + ":" + violationTimeSplited[1] + " PM"
      : violationTimeSplited[0] + ":" + violationTimeSplited[1] + " AM";
  let selectedEquipmentsIds = [];
  $(".toolsBox .tool").each((index, tool) => {
    let SelectInput = $(tool).find("input");
    let SelectedToolId;
    if ($(SelectInput).is(":checked")) {
      SelectedToolId = $(SelectInput).data("id");
      selectedEquipmentsIds.push(SelectedToolId);
    }
  });
  if (violationType != "") {
    if (violationMaterail != "") {
      if (violationMaterailQuantity != "") {
        if (violationDate != "") {
          if (violationTimeUnformatted != "") {
            // if(selectedEquipmentsIds.length>0){
            violationsData = {
              violationType: violationTypeId,
              violationMaterail: violationMaterailId,
              violationMaterailQuantity: violationMaterailQuantity,
              violationDate: violationDate + " " + violationTime,
              violationTime: violationDate + " " + violationTime,
              selectedEquipmentsIds:
                selectedEquipmentsIds.length > 0 ? selectedEquipmentsIds : [],
            };
            validViolation = true;
            // }else{
            //     functions.warningAlert("من فضلك بتحديد المعدات المضبوطة في المخالفة")
            // }
          } else {
            functions.warningAlert("من فضلك قم بتحديد وقت حدوث المخالفة");
          }
        } else {
          functions.warningAlert("من فضلك قم بتحديد تاريخ حدوث المخالفة");
        }
      } else {
        functions.warningAlert(
          "من فضلك قم بتحديد كمية الخام المضبوط بالمخالفة"
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم باختيار نوع الخام المضبوط في المخالفة"
      );
    }
  } else {
    functions.warningAlert("من فضلك قم باختيار نوع المخالفة");
  }
  if (validViolation) {
    return violationsData;
  } else {
    return validViolation;
  }
};
carViolation.DimensionsAndOtherDetails = () => {
  let DimensionsOtherDetails = {};
  let validDimensionsOthers = false;
  let coordsResponse = carViolation.GetCoordinates();
  let coordinates = carViolation.GetCoordinates().Decimal;
  let coordinatesDegrees = carViolation.GetCoordinates().Degree;
  let attachecdFiles = $(".attachCarViolationFiles")[0].files;
  let violationDescription = $("#violationDescription").val();
  let violationLeaderOpinion = $("#sectorManegrOpinionCar").val();
  let committeeMember = sharedApis.checkCommitteeMember();
  let committeeMemberId = $(".committeeMember")
    .find(".committeeData")
    .children(".committeePersonName")
    .data("id");
  let sectorId = $(".recorder")
    .find(".committeeData")
    .children(".committeePersonName")
    .data("sectorid");

  if (coordsResponse != false) {
    if (attachecdFiles != null && attachecdFiles.length > 0) {
      if (violationDescription != "") {
        if (violationLeaderOpinion != "") {
          if (committeeMember != false) {
            DimensionsOtherDetails = {
              coordinates: coordinates,
              coordinatesDegrees: coordinatesDegrees,
              violationDescription: violationDescription,
              violationLeaderOpinion: violationLeaderOpinion,
              committeeMemberId: committeeMemberId,
              sectorId: sectorId,
            };
            validDimensionsOthers = true;
          } else {
            functions.warningAlert("من فضلك قم باختيار اسم عضو اللجنة");
          }
        } else {
          functions.warningAlert("من فضلك قم بادخال رأي السيد قائد القطاع");
        }
      } else {
        functions.warningAlert("من فضلك قم بادخال الوصف الخاص بالمخالفة");
      }
    } else {
      functions.warningAlert("من فضلك قم بإرفاق المستندات الخاصة بالضبط");
    }
  } else {
    functions.warningAlert("من فضلك قم بإدخال جميع الاحداثيات وبشكل صحيح");
  }

  if (validDimensionsOthers) {
    return DimensionsOtherDetails;
  } else {
    return validDimensionsOthers;
  }
};

carViolation.formActions = () => {
  let numberOfDaysBefore = functions.getViolationStartDate(7);
  functions.inputDateFormat(".inputDate", numberOfDaysBefore, "today");
  // functions.inputDateFormat(".inputDate","","today")

  $(".violatorNationalId").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  $(".carLicenseNumbres").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  $(".driverLicenseNumber").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });

  $(".coordinatesTable")
    .children("table")
    .find("input")
    .on("keypress", (e) => {
      return functions.isNumberKey(e);
    });

  $("#violationCarType").on("change", (e) => {
    if ($(e.currentTarget).val() == "مقطورة") {
      $(".tractorBox").show();
    } else {
      $(".tractorBox").hide();
    }
  });

  $("#committeeMemberSelect").on("change", (e) => {
    $(".committeeMember")
      .find(".committeeData")
      .children(".committeePersonName,.committeePersonRank,.committeePersonJop")
      .remove();
    let memberData = sharedApis.checkCommitteeMember();
    if (memberData != false) {
      $(e.currentTarget)
        .parents(".committeeSearch")
        .siblings(".committeeData")
        .children(".reSelectMember").before(`
                <h5 class="committeePersonName" data-id="${memberData.CommitteeMemberId}">${memberData.CommitteeMemberName}</h5>
                <p class="committeePersonRank">${memberData.CommitteeMemberRank}</p>
                <p class="committeePersonJop">${memberData.CommitteeMemberJopTitle}</p>
            `);
      $(e.currentTarget).parents(".committeeSearch").hide(200);
      $(e.currentTarget)
        .parents(".committeeSearch")
        .siblings(".committeeData")
        .show(200);
    }
  });

  $(".reSelectMember").on("click", (e) => {
    $(e.currentTarget).parents(".committeeData").hide(200);
    $(e.currentTarget)
      .parents(".committeeData")
      .siblings(".committeeSearch")
      .show(200);
    $(e.currentTarget)
      .parents(".committeeData")
      .siblings(".committeeSearch")
      .find("select")
      .find("option:selected")
      .removeAttr("selected");
    $(e.currentTarget)
      .parents(".committeeData")
      .siblings(".committeeSearch")
      .find("select")
      .find("option:first-child")
      .prop("selected", true);
  });

  $(".showOnMap").on("click", (e) => {
    let Coords = carViolation.GetCoordinates().Decimal;
    carViolation.drawCoordinates(Coords);
    $(e.currentTarget).text(
      $(e.currentTarget).text() == "عرض على الخريطة"
        ? "إخفاء الخريطة"
        : "عرض على الخريطة"
    );
  });

  $("#carLicenseLetters").on("keypress", (e) => {
    if (e.currentTarget.value.length > 0) {
      let charCode = e.currentTarget.value.charCodeAt(
        e.currentTarget.value.length - 1
      );
      if (charCode >= 1569 && charCode <= 1610) {
        e.currentTarget.value += " ";
      }
    }
    return functions.isArabicLetter(e);
  });

  $("#submitCarViolation").on("click", (e) => {
    carViolation.validateForm(e);
  });

  $("#cancelCarViolation").on("click", (e) => {
    window.location.href =
      "/ViolationsRecorder/Pages/RegisteredViolationsRecords.aspx";
  });

  let violationFiles;
  let countOfFiles;
  $(".dropFilesArea").hide();
  $(".attachFilesInput").on("change", (e) => {
    violationFiles = $(e.currentTarget)[0].files;
    if (violationFiles.length > 0) {
      $(".dropFilesArea").show().empty();
    }

    for (let i = 0; i < violationFiles.length; i++) {
      $(".dropFilesArea").append(`
                <div class="file">
                    <p class="fileName">${violationFiles[i].name}</p>
                    <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
                </div>
            `);
    }
    $(".deleteFile").on("click", (e) => {
      let index = $(e.currentTarget).closest(".file").index();
      $(e.currentTarget).closest(".file").remove();
      let fileBuffer = new DataTransfer();
      for (let i = 0; i < violationFiles.length; i++) {
        if (index !== i) {
          fileBuffer.items.add(violationFiles[i]);
        }
      }
      violationFiles = fileBuffer.files;
      countOfFiles = violationFiles.length;
      if (countOfFiles == 0) {
        $(".dropFilesArea").hide();
      }
    });
  });

  let tableRows = $("#coordinatesTable tr:not(:first-child)");
  tableRows.each((index, row) => {
    let currentRow = $(row);
    let EastTds = currentRow.find("td:nth-child(2)");
    let NorthTds = currentRow.find("td:nth-child(3)");
    let E1 = EastTds.find("input:nth-child(1)");
    let E2 = EastTds.find("input:nth-child(2)");
    let E3 = EastTds.find("input:nth-child(3)");
    let N1 = NorthTds.find("input:nth-child(1)");
    let N2 = NorthTds.find("input:nth-child(2)");
    let N3 = NorthTds.find("input:nth-child(3)");
    $(E1).on("keyup", (e) => {
      if (Number($(e.currentTarget).val()) == 37) {
        $(E2).val(0);
        $(E2).attr("disabled", "disabled");
        $(E3).val(0);
        $(E3).attr("disabled", "disabled");
      } else if (
        $(e.currentTarget).val() == "" ||
        Number($(e.currentTarget).val()) != 37
      ) {
        $(E2).val("");
        $(E2).removeAttr("disabled");
        $(E3).val("");
        $(E3).removeAttr("disabled");
      }
    });
    $(N1).on("keyup", (e) => {
      if (Number($(e.currentTarget).val()) == 32) {
        $(N2).val(0);
        $(N2).attr("disabled", "disabled");
        $(N3).val(0);
        $(N3).attr("disabled", "disabled");
      } else if (
        $(e.currentTarget).val() == "" ||
        Number($(e.currentTarget).val()) != 32
      ) {
        $(N2).val("");
        $(N2).removeAttr("disabled");
        $(N3).val("");
        $(N3).removeAttr("disabled");
      }
    });
  });

  sharedApis.getGovernrates("#violationGov");
  sharedApis.getViolationZones("#violationArea");
  sharedApis.getCarType("#violationCarType");
  sharedApis.getTrafficName("#carLicenseTraffic");
  sharedApis.getTrafficName("#driverLicenseTraffic");
  sharedApis.getViolationType("#violationType");
  sharedApis.getViolationMaterails("#violationRawType");
  sharedApis.getMaterialAmmount("#RawQuantity");
  sharedApis.getEquipments(".carToolsBox");
  sharedApis.getCommitteeRecorder(
    ".committeeBox.recorder",
    ".committeeBox.sectorManager"
  );
  sharedApis.getCommitteeMember(".committeeMember");

  $(".PreLoader").removeClass("active");
};

carViolation.validateForm = (e) => {
  let carViolationData = {};
  let violatorCarDetails = carViolation.violatorCarDetails();
  let dimensionsOtherDetails = carViolation.DimensionsAndOtherDetails();
  let violationDetails = carViolation.violationDetails();
  let violatorDetails = carViolation.violatorDetails();
  // if(violatorDetails != false){
  if (violatorCarDetails != false) {
    if (violationDetails != false) {
      if (dimensionsOtherDetails != false) {
        functions.disableButton(e);
        carViolationData = {
          Title: "Test Adding New Car Violation From Form",
          OffenderType: "Vehicle",
          ViolatorName: violatorDetails.violatorName,
          NationalID: violatorDetails.violatorNationalId,
          Governrate: violatorDetails.violationGov,
          ViolationsZone: violatorDetails.violationAreaName,
          ViolatorCompany: violatorDetails.companyName,
          VehicleType: violatorDetails.carType,
          TrailerNum:
            violatorDetails.carType == "مقطورة"
              ? violatorDetails.TractorNumber
              : "",
          CarNumber: violatorCarDetails.carLicenseFullNumbers,
          CarColor: violatorCarDetails.carLicenceColor,
          VehicleBrand: violatorCarDetails.carBrand,
          TrafficName: violatorCarDetails.carLicenseTraffic,
          DrivingLicense: violatorCarDetails.driverLicenceNumber,
          TrafficLicense: violatorCarDetails.driverLicenceTraffic,
          ViolationType: violationDetails.violationType,
          MaterialType: violationDetails.violationMaterail,
          MaterialAmount: violationDetails.violationMaterailQuantity,
          ViolationDate: violationDetails.violationDate,
          ViolationTime: violationDetails.violationTime,
          Equipments: violationDetails.selectedEquipmentsIds,
          Coordinates: dimensionsOtherDetails.coordinates,
          CoordinatesDegrees: dimensionsOtherDetails.coordinatesDegrees,
          Description: dimensionsOtherDetails.violationDescription,
          LeaderOpinion: dimensionsOtherDetails.violationLeaderOpinion,
          CommiteeMember: dimensionsOtherDetails.committeeMemberId,
          Sector: dimensionsOtherDetails.sectorId,
          // "TotalPriceDue":"44",
        };
        carViolation.submitNewViolation(carViolationData);
      }
    }
  }
  // }
  carViolation.violatorCarDetails();
};

carViolation.submitNewViolation = (carViolationData) => {
  let request = {
    Data: carViolationData,
  };
  functions
    .requester(
      "/_layouts/15/Uranium.Violations.SharePoint/Violations.aspx/Save",
      { request }
    )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      $(".overlay").addClass("active");
      if (data.d.Status) {
        let carViolationId = data.d.Result.Id;
        carViolation.uploadAttachment(carViolationId, "Violations");
      } else {
        $(".overlay").removeClass("active");
        functions.warningAlert("حدث خطأ ما, لم بتم إضافة المخالفة");
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

carViolation.GetCoordinates = () => {
  var Rows = $("#coordinatesTable tr:not(:first-child)");
  let PointsArr = "[";
  let DecimalsArr = "[";
  let NumbersArr = "[";
  let IsValid = true;
  let pattern = new RegExp(/^\d*\.?\d*$/);
  Rows.each((index, Row) => {
    let CurrentRow = $(Row);
    let Cells = CurrentRow.find("td");
    let EastTds = CurrentRow.find("td:nth-child(2)");
    let NorthTds = CurrentRow.find("td:nth-child(3)");
    let PointArr = [];
    let DecimalArr = [];
    let NumberArr = [];
    Cells.each((cellIndex, Cell) => {
      let CurrentCell = $(Cell);
      let firstTd = $(Cell)[0];
      let lastTd = $(Cell)[1];
      let firstEastInputVal = Number(EastTds.find("input:nth-child(1)").val());
      // let firstEastInput = EastTds.find("input:nth-child(1)")
      // let secondEastInput = EastTds.find("input:nth-child(2)")
      // let thirdEastInput = EastTds.find("input:nth-child(3)")
      let firstNorthInputVal = Number(
        NorthTds.find("input:nth-child(1)").val()
      );
      // let firstNorthInput = NorthTds.find("input:nth-child(1)")
      // let secondNorthInput = NorthTds.find("input:nth-child(2)")
      // let thirdNorthInput = NorthTds.find("input:nth-child(3)")
      let Fields = CurrentCell.find("input");
      let Temp = [];
      // console.log(CurrentCell.find("input:nth-child(1)"))
      if (CurrentCell.index() != 3) {
        Fields.each((index, Field) => {
          let CurrentField = $(Field);
          let Value = CurrentField.val().trim();
          if (
            Value != "" &&
            pattern.test(Value) &&
            37 >= firstEastInputVal &&
            firstEastInputVal >= 24 &&
            32 >= firstNorthInputVal &&
            firstNorthInputVal >= 22
          ) {
            Temp.push(Value);
          } else {
            IsValid = false;
            return false;
          }
        });
        PointArr.push(Temp[0] + "° " + Temp[1] + "' " + Temp[2] + '"');
        NumberArr.push(Temp[0] + " " + Temp[1] + " " + Temp[2] + " ");
        DecimalArr.push(
          parseFloat(Temp[0]) +
            parseFloat(Temp[1]) / 60 +
            parseFloat(Temp[2]) / 3600
        );
      }
    });
    if (index == Rows.length - 1) {
      PointsArr += "[" + PointArr + "]";
      NumbersArr += "[" + NumberArr + "]";
      DecimalsArr += "[" + DecimalArr + "]";
    } else {
      PointsArr += "[" + PointArr + "],";
      NumbersArr += "[" + NumberArr + "],";
      DecimalsArr += "[" + DecimalArr + "],";
    }
  });
  PointsArr += "]";
  NumbersArr += "]";
  DecimalsArr += "]";
  if (IsValid) {
    return {
      Degree: PointsArr,
      Decimal: DecimalsArr,
      Numbers: NumbersArr,
    };
  } else {
    // functions.warningAlert("من فضلك قم بإدخال جميع الاحداثيات وبشكل صحيح")
    return false;
  }
};

carViolation.uploadAttachment = (NewCarViolationID, ListName) => {
  let Data = new FormData();
  Data.append("itemId", NewCarViolationID);
  Data.append("listName", ListName);
  for (let i = 0; i <= $("#attachCarViolationFiles")[0].files.length; i++) {
    Data.append("file" + i, $("#attachCarViolationFiles")[0].files[i]);
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
        "تم إضافة مخالفة جديدة لعربة بنجاح",
        false,
        "/ViolationsRecorder/Pages/RegisteredViolationsRecords.aspx"
      );
    },
    error: (err) => {
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      $(".overlay").removeClass("active");
      console.log(err.responseText);
    },
  });
};
carViolation.drawCoordinates = (Coords) => {
  console.log(Coords);
  $(".ShowOnMapBox").toggle();
  // let dojoConfig = {
  //     // ... your stuff
  //     packages: [
  //       {'jquery': 'https://code.jquery.com/jquery-3.6.1.min.js'}
  //     ]
  // }
  // if($("#coordinatesMap").length > 0){
  //     require([
  //         "esri/Map",
  //         "esri/views/MapView",
  //         // "esri/Graphic",
  //         // "esri/Basemap",
  //         // "esri/layers/FeatureLayer",
  //         // "esri/layers/support/LabelClass",
  //         // "esri/core/watchUtils",
  //         // "esri/widgets/Home",
  //     ],(Map,MapView)=>{
  //         // let myMap = new Map({
  //         //     // basemap: "topo-vector",
  //         //     // basemap : new Basemap({
  //         //     //     portalItem: {
  //         //     //         id: "6eb69353f886481d9f148a9a6281961a", // the id for the base map with out labels
  //         //     //         portal: "https://www.arcgis.com"
  //         //     //     }
  //         //     // })
  //         // })

  //         // let view = new MapView({
  //         //     container: "coordinatesMap",
  //         //     map: myMap,
  //         //     zoom: 6,
  //         //     center: [30.82763671874111, 26.657277674210142],
  //         //     cursor: "pointer",
  //         // });
  //     })
  // }
};
export default carViolation;
