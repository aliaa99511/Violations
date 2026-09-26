import Swal from "sweetalert2";
import functions from "../../Shared/functions";
import sharedApis from "../../Shared/sharedApiCall";

let equipmentViolation = {};
var urlParams = new URLSearchParams(window.location.search);
var editViolationId;
let isPresidencyUser = false;
var originalViolationData = null;

equipmentViolation.getCurrentUserConfiguration = () => {
  let UserId = _spPageContextInfo.userId;

  return functions.callSharePointListApi("Configurations")
    .then((Users) => {
      let UsersData = Users.value || [];

      isPresidencyUser = UsersData.some((User) => {
        return (
          User.UserIdId &&
          User.UserIdId.some((id) => Number(id) === Number(UserId)) &&
          User.Type === "PresidencyUser"
        );
      });

      return isPresidencyUser;
    })
    .catch((err) => {
      console.log("Error loading current user configuration:", err);
      isPresidencyUser = false;
      return false;
    });
};

equipmentViolation.violatorDetails = () => {
  let vaildViolator = false;
  let violatorDetails = {};
  let violatorNameCheck = functions.getNameInTriple("#violatorName");
  let violatorName = $("#violatorName").val();
  let violatorNationalId = $("#violatorNationalId").val();
  let violatorMobileNumber = $("#violatorMobileNumber").val();
  let violationPrevCount = $("#prevViolationsCount").val();
  let violationGov = $("#violationGov").children("option:selected").val();
  let violationGovId = $("#violationGov").children("option:selected").data("id");
  let violationArea = $("#violationArea").val();
  let companyName = $("#companyName").val();
  let commercialRegister = $("#commercialRegister").val();
  let vehicleIdentificationNumber = $("#vehicleIdentificationNumber").val();
  let NationalIdRegExp = /^(2|3)[0-9][0-9][0-1][0-9][0-3][0-9](01|02|03|04|11|12|13|14|15|16|17|18|19|21|22|23|24|25|26|27|28|29|31|32|33|34|35|88)\d\d\d\d\d$/;

  if (violatorNameCheck) {
    if (violationGov != "") {
      if (violationArea != "") {
        if (violatorMobileNumber && violatorMobileNumber.trim() !== "") {

          // Check National ID if provided
          if (violatorNationalId !== "") {
            // Check if exactly 14 digits
            if (!/^\d{14}$/.test(violatorNationalId)) {
              functions.warningAlert(
                "الرقم القومي يجب أن يتكون من 14 رقمًا بالضبط",
                "#violatorNationalId"
              );
              return false;
            }
          }

          violatorDetails = {
            violatorName: violatorName,
            violatorNationalId: violatorNationalId != "" ? violatorNationalId : "",
            violatorMobileNumber: violatorMobileNumber.trim(),
            violationPrevCount: Number(violationPrevCount),
            companyName: companyName != "" ? companyName : "",
            commercialRegister: commercialRegister != "" ? commercialRegister : "",
            vehicleIdentificationNumber: vehicleIdentificationNumber != "" ? vehicleIdentificationNumber : "",
            violationAreaName: violationArea,
            violationGov: violationGovId,
          };
          vaildViolator = true;
        } else {
          functions.warningAlert("من فضلك قم بادخال رقم الهاتف المحمول", "#violatorMobileNumber");
        }
      } else {
        functions.warningAlert("من فضلك قم بادخال منطقة ضبط المخالفة", "#violationArea");
      }
    } else {
      functions.warningAlert("من فضلك قم باختيار المحافظة الواقع بها المخالفة", "#violationGov");
    }
  } else {
    functions.warningAlert("من فضلك قم بادخال اسم المخالف ثلاثي بشكل صحيح", "#violatorName");
  }
  if (vaildViolator) {
    return violatorDetails;
  } else {
    return vaildViolator;
  }
};

equipmentViolation.violationDetails = () => {
  let violationsData = {};
  let isBonesViolation = false;
  let BonesVisible = false;
  let validViolation = false;
  let violationType = $("#violationType").children("option:selected").val();
  let violationTypeId = $("#violationType")
    .children("option:selected")
    .data("id");
  let violationMaterail = $("#quarryViolationRawType")
    .children("option:selected")
    .val();
  let violationMaterailId = $("#quarryViolationRawType")
    .children("option:selected")
    .data("id");
  let violationDate = $("#violationDate").val();
  let violationTimeUnformatted = $("#violationTime").val();
  let violationTimeSplited = violationTimeUnformatted.split(":");
  let violationTime =
    violationTimeSplited[0] > 12
      ? violationTimeSplited[0] - 12 + ":" + violationTimeSplited[1] + " PM"
      : violationTimeSplited[0] + ":" + violationTimeSplited[1] + " AM";
  let quarryType = $("#quarryType").children("option:selected").val();
  let quarryCode = $("#quarryCode").val();
  let selectedEquipementsIds = [];
  let selectedEquipmentsData = [];
  let EquipmentsData = {};
  $(".toolsBox .tool").each((index, tool) => {
    let SelectInput = $(tool).find("input");
    let toolCount = $(tool).find(".toolCount");
    let SelectedToolId;
    let toolCountVal;
    if ($(SelectInput).is(":checked")) {
      SelectedToolId = $(SelectInput).data("id");
      toolCountVal = $(toolCount).val();
      EquipmentsData = {
        id: SelectedToolId,
        count: Number(toolCountVal),
      };
      selectedEquipementsIds.push(SelectedToolId);
      selectedEquipmentsData.push(EquipmentsData);
    }
  });
  if (
    violationType == "اصدار بونات فارغة" ||
    violationType == "بيع بونات" ||
    violationType == "استخدام بونات الغير" ||
    violationType == "تلاعب ببيانات البونات"
  ) {
    isBonesViolation = true;
  } else {
    isBonesViolation = false;
  }

  if (!isBonesViolation) {
    if (violationDate != "") {
      if (violationTimeUnformatted != "") {
        if (selectedEquipmentsData.length > 0) {
          violationsData = {
            violationType: violationTypeId,
            violationMaterail: violationMaterailId,
            violationDate: violationDate + " " + violationTime,
            violationTime: violationDate + " " + violationTime,
            quarryType: quarryType,
            quarryCode: quarryCode,
            isBonesViolation: isBonesViolation,
            selectedEquipmentsData: selectedEquipmentsData,
            selectedEquipementsIds: selectedEquipementsIds,
          };
          validViolation = true;
        } else {
          functions.warningAlert(
            "من فضلك قم بتحديد المعدات التي تم ضبطها",
            ".toolsBox"
          );
        }
      } else {
        functions.warningAlert(
          "من فضلك قم بتحديد وقت حدوث المخالفة",
          "#violationTime"
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بتحديد تاريخ حدوث المخالفة",
        "#violationDate"
      );
    }
  } else if (
    violationType != "" &&
    isBonesViolation &&
    $(".BonesBox").is(":visible")
  ) {
    let BonesCount = Number($(".BonesCount").val());

    if (violationDate != "") {
      if (violationTimeUnformatted != "") {
        // if (selectedEquipmentsData.length > 0) {
        violationsData = {
          violationType: violationTypeId,
          violationMaterail: violationMaterailId,
          violationDate: violationDate + " " + violationTime,
          violationTime: violationDate + " " + violationTime,
          quarryType: quarryType,
          quarryCode: quarryCode,
          BonsNumber: BonesCount,
          isBonesViolation: isBonesViolation,
          selectedEquipmentsData: selectedEquipmentsData,
          selectedEquipementsIds: selectedEquipementsIds,
        };
        validViolation = true;
        // } else {
        //     functions.warningAlert("من فضلك قم باختيار المعدات التي تم ضبطها", ".toolsBox")
        // }
      } else {
        functions.warningAlert(
          "من فضلك قم بتحديد وقت حدوث المخالفة",
          "#violationTime"
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بتحديد تاريخ حدوث المخالفة",
        "#violationDate"
      );
    }
  } else {
    functions.warningAlert("من فضلك قم باختيار نوع المخالفة", "#violationType");
  }
  if (validViolation) {
    return violationsData;
  } else {
    return validViolation;
  }
};
equipmentViolation.violationDimensionsCoordsDetails = () => {
  let violationDimensionsData = {};
  let validDimensions = false;
  let violationDepth = $("#violationDepth").val();
  let violationAreaSpace = $("#AreaSpace").val();
  let violationQuantity = $("#totalAreaSpace").val();
  let distanceToNearQuarry = $("#distanceToNearQuarry").val();
  let NearestQuarryCode = $("#NearestQuarryNumber").val();
  let coordsResponse = equipmentViolation.GetCoordinates();
  let coordinates = equipmentViolation.GetCoordinates().Decimal;
  let coordinatesDegrees = equipmentViolation.GetCoordinates().Degree;
  let NumbersRegex =
    /(?:^|\s)(?=.)((?:0|(?:[1-9](?:\d*|\d{0,2}(?:,\d{3})*)))?(?:\.\d*[1-9])?)(?!\S)/;

  if (coordsResponse != false) {
    // if(coordinates.length>=4){
    violationDimensionsData = {
      violationDepth: Number(violationDepth ? violationDepth : 0),
      violationAreaSpace: Number(violationAreaSpace ? violationAreaSpace : 0),
      violationQuantity: Number(violationQuantity),
      distanceToNearQuarry: Number(
        distanceToNearQuarry ? distanceToNearQuarry : 0
      ),
      NearestQuarryCode: NearestQuarryCode,
      coordinates: coordinates,
      coordinatesDegrees: coordinatesDegrees,
    };
    validDimensions = true;
    // }else{
    //     functions.warningAlert("من فضلك قم بإدخال جميع الاحداثيات وبشكل صحيح")
    // }
  } else {
    functions.warningAlert(
      "من فضلك قم بإدخال جميع الاحداثيات وبشكل صحيح",
      "#coordinatesTable"
    );
  }

  if (validDimensions) {
    return violationDimensionsData;
  } else {
    return validDimensions;
  }
};

equipmentViolation.otherViolationDetails = () => {
  let otherViolationDetails = {};
  let validOtherDetails = false;
  let violationDescription = $("#violationDescription").val();
  let violationLeaderOpinion = $("#sectorManegrOpinion").val();
  let member = $("#committeeMemberText").val();
  /////////////////////////////////////////////////
  let committeeMember = sharedApis.checkCommitteeMember();
  let selectedMembersIds = [];
  let membersNamesText = "";

  let members = $(".committeeMember")
    .find(".membersDataBox")
    .find(".memberData");
  let committeeMemberId;
  members.each((index, memberName) => {
    committeeMemberId = Number($(memberName).data("id"));
    selectedMembersIds.push(committeeMemberId);
    membersNamesText +=
      $(memberName).find(".committeePersonRank").text() +
      " " +
      $(memberName).find(".committeePersonName").text() +
      " " +
      $(memberName).find(".committeePersonJop").text() +
      "\n";
  });

  if (violationDescription != "") {
    if (membersNamesText != "") {
      // if(committeeMember != false){
      if (violationLeaderOpinion != "") {
        otherViolationDetails = {
          violationDescription: violationDescription,
          violationLeaderOpinion: violationLeaderOpinion,
          member: member,
          membersNamesText: membersNamesText,
          // committeeMembersId: selectedMembersIds.length > 0 ? selectedMembersIds : [],
          // sectorId:sectorId,
        };
        validOtherDetails = true;
        // }else{
        //     functions.warningAlert("من فضلك قم باختيار اسم عضو اللجنة")
        // }
      } else {
        functions.warningAlert(
          "من فضلك قم بادخال رأي السيد قائد القطاع",
          "#sectorManegrOpinion"
        );
      }
    } else {
      functions.warningAlert(
        "من فضلك قم بادخال القائمون بالضبط ",
        "#committeeMember"
      );
    }
  } else {
    functions.warningAlert(
      "من فضلك قم بادخال الوصف الخاص بالمخالفة",
      "#violationDescription"
    );
  }

  if (validOtherDetails) {
    return otherViolationDetails;
  } else {
    return validOtherDetails;
  }
};
equipmentViolation.formActions = () => {
  equipmentViolation.getCurrentUserConfiguration();

  if (urlParams.get("taskId") !== null) {
    $("#oldFilesBox").show();
  }

  let numberOfDaysBefore = functions.getViolationStartDate(3);
  functions.inputDateFormat(
    ".inputDate",
    numberOfDaysBefore,
    "today",
    "dd/mm/yyyy"
  );

  $("#violationType").on("change", (e) => {
    if (
      $(e.currentTarget).val() == "اصدار بونات فارغة" ||
      $(e.currentTarget).val() == "بيع بونات" ||
      $(e.currentTarget).val() == "استخدام بونات الغير" ||
      $(e.currentTarget).val() == "تلاعب ببيانات البونات"
    ) {
      $(".BonesBox").show();
    } else {
      $(".BonesBox").hide();
    }
  });

  // if($(".violationDepth").val() != "" && $(".AreaSpace").val() != ""){
  $(".AreaSpace").on("keyup", (e) => {
    let cubicAreaSpace = $(e.currentTarget).val() * $(".violationDepth").val();
    $(".totalAreaSpace").val(cubicAreaSpace.toFixed(3));
    if ($(e.currentTarget).val() == "" && $(".violationDepth").val() == "") {
      $(".totalAreaSpace").val("");
    }
  });
  $(".violationDepth").on("keyup", (e) => {
    let cubicAreaSpace = $(e.currentTarget).val() * $(".AreaSpace").val();
    $(".totalAreaSpace").val(cubicAreaSpace.toFixed(3));
    if ($(e.currentTarget).val() == "" && $(".AreaSpace").val() == "") {
      $(".totalAreaSpace").val("");
    }
  });
  // }
  $(".violatorNationalId").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  $(".violatorMobileNumber").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  $(".prevViolationsCount").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  $(".BonesCount").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  // $(".violationDepth").on("keypress", (e) => {
  //     return functions.isNumberKey(e)
  // })
  // $(".AreaSpace").on("keypress", (e) => {
  //     return functions.isNumberKey(e)
  // })
  $(".distanceToNearQuarry").on("keypress", (e) => {
    return functions.isNumberKey(e);
  });
  // .toFixed(1);
  // $(".coordinatesTable").children("table").find("input").on("keypress",(e)=>{
  //     return functions.isNumberKey(e)
  // })

  $(".coordinatesTable")
    .children("table")
    .find("td")
    .children("input:nth-child(1)")
    .on("keypress", (e) => {
      return functions.isNumberKey(e);
    });
  $(".coordinatesTable")
    .children("table")
    .find("td")
    .children("input:nth-child(2)")
    .on("keypress", (e) => {
      return functions.isNumberKey(e);
    });
  $(".coordinatesTable")
    .children("table")
    .find("td")
    .children("input:nth-child(3)")
    .on("keypress", (e) => {
      return functions.isDecimalNumberKey(e);
    });

  // $("#committeeMemberSelect").on("change",(e)=>{
  //     $(".committeeMember").find(".committeeData").children(".committeePersonName,.committeePersonRank,.committeePersonJop").remove()
  //     let memberData = sharedApis.checkCommitteeMember()
  //     if(memberData != false){
  //         $(e.currentTarget).parents(".committeeSearch").siblings(".committeeData").children(".reSelectMember").before(`
  //             <h5 class="committeePersonName" data-id="${memberData.CommitteeMemberId}">${memberData.CommitteeMemberName}</h5>
  //             <p class="committeePersonRank">${memberData.CommitteeMemberRank}</p>
  //             <p class="committeePersonJop">${memberData.CommitteeMemberJopTitle}</p>
  //         `)
  //         // $(e.currentTarget).parents(".committeeSearch").hide(200)
  //         // $(e.currentTarget).parents(".committeeSearch").siblings(".committeeData").show(200)
  //     }
  // })

  ////////////////////////////////////////////////////////////////////////////////////////////////
  $(".submitSelectedMembersBtn").on("click", (e) => {
    $(".committeeMember")
      .find(".committeeData")
      .children(".membersDataBox")
      .empty();
    let membersData = sharedApis.checkCommitteeMember();
    if (membersData.length > 0) {
      membersData.forEach((memberData) => {
        $(e.currentTarget)
          .parents(".committeeSearch")
          .siblings(".committeeData")
          .children(".membersDataBox").append(`
                <div class="memberData">
                    <p class="committeePersonRank">${memberData.CommitteeMemberRank}/ </p>
                    <h5 class="committeePersonName" data-id="${memberData.CommitteeMemberId}">${memberData.CommitteeMemberName}</h5>
                    </div>`);
      });
      // <p class="committeePersonJop">(${memberData.CommitteeMemberJopTitle})</p>
      $(e.currentTarget).parents(".committeeSearch").hide(200);
      $(e.currentTarget)
        .parents(".committeeSearch")
        .siblings(".committeeData")
        .show(200);
    } else {
      functions.warningAlert(
        "لم يتم إضافة أي عضو لجنة, من فضلك قم بالاضافة أولا لعرض بيانات الأعضاء"
      );
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
      .children("option")
      .removeAttr("selected");
    $(e.currentTarget)
      .parents(".committeeData")
      .siblings(".committeeSearch")
      .find("select")
      .find("option:first-child")
      .prop("selected", true);
  });
  ////////////////////////////////////////////////////////////////////////////////////////////////

  // $(".showOnMap").on("click", (e) => {
  //     let Coords = equipmentViolation.GetCoordinates().Decimal
  //     if (Coords != undefined) {
  //         equipmentViolation.drawCoordinates(Coords)
  //         $(e.currentTarget).text($(e.currentTarget).text() == "عرض على الخريطة" ? "إخفاء الخريطة" : "عرض على الخريطة")
  //         $(".ShowOnMapBox").toggle()
  //     } else {
  //         functions.warningAlert("لا يمكن عرض الخريطة قبل إدخال الإحداثيات, من فضلك أدخل الإحداثيات أولا")
  //     }
  // })

  $("#AddPoint").on("click", (e) => {
    equipmentViolation.AddCoordinatePoint(e);
  });

  $("#submitQuarryViolation").on("click", (e) => {
    if (urlParams.get("isViolationEdit") === "true") {
      equipmentViolation.validateViolationEditForm(e);
    } else {
      equipmentViolation.validateForm(e); // create + isRejectedBefore, unchanged
    }
  });
  $("#cancelQuarryViolation").on("click", (e) => {
    window.location.href =
      "/ViolationsRecorder/Pages/Registered-Violations.aspx";
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

  const bindFileInput = (selector) => {
    const $input = $(selector);
    const input = $input[0];
    if (!input) return;
    const $area = $input.parents(".fileBox").siblings(".dropFilesArea");

    // Draw the names under THIS input only
    const render = () => {
      $area.empty();
      if (!input.files.length) {
        $area.hide();
        return;
      }
      Array.from(input.files).forEach((f, i) => {
        const $file = $(
          `<div class="file">
             <p class="fileName"></p>
             <span class="deleteFile" data-index="${i}"><i class="fa-sharp fa-solid fa-x"></i></span>
           </div>`
        );
        $file.find(".fileName").text(f.name); // .text() avoids HTML injection
        $area.append($file);
      });
      $area.show();
    };

    $input.on("change", () => {
      const hasInvalid = Array.from(input.files).some(
        (f) => !filesExtension.includes(f.name.split(".").pop().toLowerCase())
      );
      if (hasInvalid) {
        functions.warningAlert("من فضلك أدخل الملفات بالمرفقات المسموح بها فقط");
        input.value = "";
      }
      render();
    });

    // Delete handler bound once, scoped to this input's own area
    $area.on("click", ".deleteFile", (ev) => {
      const idx = Number($(ev.currentTarget).data("index"));
      const dt = new DataTransfer();
      Array.from(input.files).forEach((f, i) => {
        if (i !== idx) dt.items.add(f);
      });
      input.files = dt.files; // keeps the real input in sync with what is shown
      render();
    });
  };

  bindFileInput(".attachViolationFiles");
  bindFileInput(".attachViolationReportFile");
  bindFileInput(".attachOldFiles");


  // let tableRows = $("#coordinatesTable tr:not(:first-child)");
  // tableRows.each((index, row) => {
  //   let currentRow = $(row);
  //   $(currentRow)
  //     .find("td:nth-child(2)")
  //     .find("input:nth-child(1)")
  //     .on("keyup", (e) => {
  //       if (Number($(e.currentTarget).val()) == 37) {
  //         $(e.currentTarget).closest("td").find("input:nth-child(2)").val(0);
  //         $(e.currentTarget)
  //           .closest("td")
  //           .find("input:nth-child(2)")
  //           .attr("disabled", "disabled");
  //         $(e.currentTarget).closest("td").find("input:nth-child(3)").val(0);
  //         $(e.currentTarget)
  //           .closest("td")
  //           .find("input:nth-child(3)")
  //           .attr("disabled", "disabled");
  //       } else if (
  //         $(e.currentTarget).val() == "" ||
  //         Number($(e.currentTarget).val()) != 37
  //       ) {
  //         $(e.currentTarget).closest("td").find("input:nth-child(2)").val("");
  //         $(e.currentTarget)
  //           .closest("td")
  //           .find("input:nth-child(2)")
  //           .removeAttr("disabled");
  //         $(e.currentTarget).closest("td").find("input:nth-child(3)").val("");
  //         $(e.currentTarget)
  //           .closest("td")
  //           .find("input:nth-child(3)")
  //           .removeAttr("disabled");
  //       }
  //     });
  //   $(currentRow)
  //     .find("td:nth-child(3)")
  //     .find("input:nth-child(1)")
  //     .on("keyup", (e) => {
  //       if (Number($(e.currentTarget).val()) == 32) {
  //         $(e.currentTarget).closest("td").find("input:nth-child(2)").val(0);
  //         $(e.currentTarget)
  //           .closest("td")
  //           .find("input:nth-child(2)")
  //           .attr("disabled", "disabled");
  //         $(e.currentTarget).closest("td").find("input:nth-child(3)").val(0);
  //         $(e.currentTarget)
  //           .closest("td")
  //           .find("input:nth-child(3)")
  //           .attr("disabled", "disabled");
  //       } else if (
  //         $(e.currentTarget).val() == "" ||
  //         Number($(e.currentTarget).val()) != 32
  //       ) {
  //         $(e.currentTarget).closest("td").find("input:nth-child(2)").val("");
  //         $(e.currentTarget)
  //           .closest("td")
  //           .find("input:nth-child(2)")
  //           .removeAttr("disabled");
  //         $(e.currentTarget).closest("td").find("input:nth-child(3)").val("");
  //         $(e.currentTarget)
  //           .closest("td")
  //           .find("input:nth-child(3)")
  //           .removeAttr("disabled");
  //       }
  //     });
  // });

  sharedApis.getGovernrates("#violationGov");
  // sharedApis.getViolationZones("#violationArea")
  sharedApis.getViolationType("#violationType", "Equipment");
  sharedApis.getViolationMaterails("#quarryViolationRawType");
  sharedApis.getQuarryType("#quarryType");
  sharedApis.getEquipments(".quarryToolsBox");
  sharedApis.getCommitteeRecorder(
    ".committeeBox.recorder",
    ".committeeBox.sectorManager"
  );
  // sharedApis.getCommitteeMember(".committeeMember")
  equipmentViolation.getCommitteeMember();
  $(".overlay").removeClass("active");
};
equipmentViolation.getCommitteeMember = () => {
  return new Promise(function (resolve, reject) {
    $.ajax({
      type: "GET",
      url:
        _spPageContextInfo.siteAbsoluteUrl +
        "/_api/web/lists/getbytitle('Configurations')/items?$OrderBy=Title asc&$top=1000",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        if (data != null) {
          resolve(data);
          let UsersData = data.value;
          UsersData.forEach((User) => {
            if (User.Type == "CommiteeMember") {
              $(".committeeMember").find(".selectBox").children("select")
                .append(`
                                <option value="${User.ID}" data-memberrank="${User.Rank}" data-jobtitle="${User.JobTitle1}"><span>${User.Rank}/</span> ${User.Title}</option>
                            `);
            }
          });
        } else {
          resolve([]);
        }
      },
      error: (xhr) => {
        console.log(xhr.responseText);
      },
    });
  });
};
equipmentViolation.validateForm = (e) => {
  let UserId = _spPageContextInfo.userId;
  let ViolationData = {};
  let attachecdFiles = $("#attachViolationFiles")[0].files;
  let attachecdReportFiles = $("#attachViolationReportFile")[0].files;
  let otherViolationDetails = equipmentViolation.otherViolationDetails();
  let violationsDimensions = equipmentViolation.violationDimensionsCoordsDetails();
  let violationDetails = equipmentViolation.violationDetails();
  let violatorDetails = equipmentViolation.violatorDetails();
  let SectorMembers = $(".membersText").val();
  let violationDateArr = violationDetails.violationDate.split("/");
  let violationDate = `${violationDateArr[1]}-${violationDateArr[0]}-${violationDateArr[2]}`;
  let violationTimeArr = violationDetails.violationTime.split("/");
  let violationTime = `${violationTimeArr[1]}-${violationTimeArr[0]}-${violationTimeArr[2]}`;

  // Check if calculate by ton checkbox is checked
  let isCalculateByTon = $("#calculateByTon").is(":checked");

  if (SectorMembers != "") {
    if (violatorDetails != false) {
      if (violationDetails != false) {
        if (violationsDimensions != false) {
          if (attachecdFiles != null && attachecdFiles.length > 0) {
            if (attachecdReportFiles != null && attachecdReportFiles.length > 0) {
              if (otherViolationDetails != false) {
                let isOldFilesRequired = $("#oldFilesBox").is(":visible");
                let attachedOldFiles = $("#attachOldFiles")[0]?.files || [];

                if (isOldFilesRequired && attachedOldFiles.length === 0) {
                  functions.warningAlert(
                    "من فضلك قم بإرفاق الملفات القديمة",
                    "#attachOldFiles"
                  );
                  return;
                }

                ViolationData = {
                  // Edit violation 
                  ID: urlParams.get("taskId") !== null ? editViolationId : "",
                  IsEdit: urlParams.get("isRejectedBefore") === "true",
                  IsRejectedBefore: urlParams.get("isRejectedBefore") === "true",
                  IsViolationEdit: urlParams.get("isViolationEdit") === "true",

                  Title: "New Equipment Violation",
                  OffenderType: "Equipment",
                  ViolatorName: violatorDetails.violatorName,
                  NationalID: violatorDetails.violatorNationalId,
                  MobileNumber: violatorDetails.violatorMobileNumber,
                  NumOfPreviousViolations: violatorDetails.violationPrevCount,
                  ViolatorCompany: violatorDetails.companyName,
                  CommercialRegister: violatorDetails.commercialRegister,
                  VehicleIdentificationNumber: violatorDetails.vehicleIdentificationNumber || "",
                  Governrate: violatorDetails.violationGov,
                  ViolationsZone: violatorDetails.violationAreaName,

                  ViolationType: 19,
                  BonsNumber: violationDetails.isBonesViolation
                    ? violationDetails.BonsNumber
                    : 0,
                  MaterialType: violationDetails.violationMaterail,
                  ViolationDate: violationDate,
                  ViolationTime: violationTime,
                  QuarryType: violationDetails.quarryType,
                  QuarryCode: violationDetails.quarryCode,
                  Equipments: violationDetails.selectedEquipementsIds,
                  EquipmentsCount: violationDetails.selectedEquipmentsData,

                  SkipCalculation: isPresidencyUser ? true : false,
                  Depth: violationsDimensions.violationDepth,
                  Area: violationsDimensions.violationAreaSpace,
                  TotalQuantity: isPresidencyUser ? 0 : violationsDimensions.violationQuantity,
                  DistanceToNearestQuarry: violationsDimensions.distanceToNearQuarry,
                  NearestQuarryCode: violationsDimensions.NearestQuarryCode,
                  Coordinates: violationsDimensions.coordinates,
                  CoordinatesDegrees: violationsDimensions.coordinatesDegrees,

                  Description: otherViolationDetails?.violationDescription,
                  LeaderOpinion: otherViolationDetails?.violationLeaderOpinion,
                  CommiteeMember: otherViolationDetails.membersNamesText != "" ? otherViolationDetails.membersNamesText : "-",
                  SectorMembers: SectorMembers,
                  Sector: 0,
                };

                // Add MaterialUnit property if calculate by ton is checked
                if (isCalculateByTon) {
                  ViolationData.MaterialUnit = "طن";
                }

                equipmentViolation.submitNewViolation(e, ViolationData);
              }
            } else {
              functions.warningAlert("من فضلك قم بإرفاق التقرير المصور", "#attachViolationReportFile");
            }
          } else {
            functions.warningAlert("من فضلك قم بإرفاق أصل محضر الضبط", "#attachViolationFiles");
          }
        }
      }
    }
  } else {
    functions.warningAlert("من فضلك قم بادخال اعضاء اللجنة");
  }
};
equipmentViolation.submitNewViolation = (e, ViolationData) => {
  $(".overlay").addClass("active");
  let request = {
    Data: ViolationData,
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
        let ViolationId = data.d.Result.Id;
        functions.disableButton(e);
        equipmentViolation.uploadAttachment(ViolationId, "Violations");
        // equipmentViolation.uploadAttachment(ViolationId,"Violations","#attachViolationFiles")
        // equipmentViolation.uploadAttachment(ViolationId,"Violations","#attachViolationReportFile")
      } else {
        $(".overlay").removeClass("active");
        functions.warningAlert("حدث خطأ ما, لم بتم إضافة المخالفة");
      }
    })
    .catch((err) => {
      $(".overlay").removeClass("active");
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      console.log(err);
    });
};
equipmentViolation.uploadAttachment = (NewViolationID, ListName) => {
  $(".overlay").addClass("active");

  let Data = new FormData();

  Data.append("itemId", NewViolationID);
  Data.append("listName", ListName);
  Data.append("Method", urlParams.get("taskId") !== null ? "Edit" : "");

  let fileIndex = 0;
  const P = functions.ATTACHMENT_PREFIX;

  const appendFiles = (selector, prefix) => {
    const files = $(selector)[0]?.files || [];
    for (let i = 0; i < files.length; i++) {
      // 3rd argument = the file name the server will store
      Data.append(`file${fileIndex}`, files[i], prefix + files[i].name);
      fileIndex++;
    }
  };

  appendFiles("#attachViolationFiles", P.original);
  appendFiles("#attachViolationReportFile", P.report);
  // Old files - only available during edit
  if (urlParams.get("taskId") !== null) {
    appendFiles("#attachOldFiles", P.old);
  }

  $.ajax({
    type: "POST",
    url: "/_layouts/15/Uranium.Violations.SharePoint/Attachments.aspx/Upload",
    processData: false,
    contentType: false,
    data: Data,

    success: (data) => {
      $(".overlay").removeClass("active");

      let redirectUrl = "/ViolationsRecorder/Pages/Registered-Violations.aspx";

      functions.sucessAlert(
        urlParams.get("taskId")
          ? "تم تعديل مخالفة معدة بنجاح"
          : "تم إضافة مخالفة معدة جديدة بنجاح",
        false,
        redirectUrl
      );
    },

    error: (err) => {
      functions.warningAlert("خطأ في إرسال البيانات لقاعدة البيانات");
      $(".overlay").removeClass("active");
      console.log(err.responseText);
    },
  });
};

equipmentViolation.GetCoordinates = () => {
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
      let secondEastInputVal = Number(EastTds.find("input:nth-child(2)").val());
      let thirdEastInputVal = Number(EastTds.find("input:nth-child(3)").val());
      // let firstEastInput = EastTds.find("input:nth-child(1)")
      let firstNorthInputVal = Number(
        NorthTds.find("input:nth-child(1)").val()
      );
      let secondNorthInputVal = Number(
        NorthTds.find("input:nth-child(2)").val()
      );
      let thirdNorthInputVal = Number(
        NorthTds.find("input:nth-child(3)").val()
      );
      // let firstNorthInput = NorthTds.find("input:nth-child(1)")
      let Fields = CurrentCell.find("input");
      let Temp = [];
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
            firstNorthInputVal >= 22 &&
            60 >= secondEastInputVal &&
            60 >= thirdEastInputVal &&
            60 >= secondNorthInputVal &&
            60 >= thirdNorthInputVal
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
equipmentViolation.AddCoordinatePoint = (e) => {
  let coordinatesTable = $("#coordinatesTable");
  let cloneRow = $("#coordinatesTable")
    .find("tr.hideRow")
    .clone(true)
    .removeClass("hideRow table-line");
  let ClonedTr = $(cloneRow);
  ClonedTr.children().hide();
  ClonedTr.find("td input").val("");
  ClonedTr.find("td:last-child").append(
    `<span class="deleteCoordinate"><i class="fas fa-trash-alt"></i></span>`
  );
  ClonedTr.find(".deleteCoordinate").on("click", (e) =>
    equipmentViolation.DeleteCoordinatePoint(e)
  );
  coordinatesTable.find("table").append(cloneRow);
  coordinatesTable.find("table tr:last-child").children().fadeIn();
  equipmentViolation.OrderTableRow();
};
equipmentViolation.DeleteCoordinatePoint = (e) => {
  var element = $(e.currentTarget);
  let RowsLength = $("#coordinatesTable table").find("tr").length;

  // Remove the validation that requires minimum 4 rows
  Swal.fire({
    icon: "warning",
    customClass: "sweetStyle",
    title: "هل انت متأكد؟",
    text: "تأكيد حذف الإحداثيات ؟",
    showCancelButton: true,
    cancelButtonText: "لا",
    confirmButtonColor: "#3085d6",
    confirmButtonText: "نعم",
    heightAuto: true,
  }).then((result) => {
    if (result.value) {
      let CurrentRow = $(element).parents("tr");
      CurrentRow.children().fadeOut(300, () => {
        CurrentRow.remove(); // Changed from detach() to remove()
        equipmentViolation.OrderTableRow();
      });
    }
  });
};
equipmentViolation.OrderTableRow = () => {
  var Rows = $("#coordinatesTable tr:not(:first-child)");
  Rows.each((index, Row) => {
    let CurrentRow = $(Row);
    let CurrentIndex = CurrentRow.index();
    CurrentRow.find("th").html(CurrentIndex);
  });
};
equipmentViolation.drawCoordinates = (Coords) => {
  let pointLat;
  let pointLng;
  let marker;
  let splitedCoords = Coords.split("],");
  let firstPoint = splitedCoords[0];
  let filteredFirstPoint = firstPoint.replace("[[", "").trim().split(",");
  pointLat = filteredFirstPoint[0];
  pointLng = filteredFirstPoint[1];
  marker = `marker=${pointLat};${pointLng}`;
  $(".ShowOnMapBox").find("#coordinatesMap").empty();
  $(".ShowOnMapBox").find("#coordinatesMap").append(`
        <div class="embed-container">
            <iframe width="500" height="400" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" title="World Bank Map" src="//www.arcgis.com/apps/Embed/index.html?webmap=051417efba8a4a14ac04ef195beb3b05&extent=26.6843,26.2561,33.4299,29.5516&zoom=true&previewImage=false&scale=true&disable_scroll=true&theme=light&${marker}"></iframe>
        </div>
    `);
};
////////////////// edit ///////////////
equipmentViolation.editViolation = () => {
  if (urlParams.get("taskId") !== null) {
    $(".overlay").addClass("active");
    functions
      .requester(
        "/_layouts/15/Uranium.Violations.SharePoint/Tasks.aspx/FindbyId",
        {
          Id: urlParams.get("taskId"),
        }
      )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        let violationData = data.d.Violation;
        editViolationId = data.d.ViolationId;
        let commonEditResult = functions.commonEditData(violationData, data.d.ViolationId, 4);

        $("#BonesCount").val(violationData.BonsNumber).trigger("change");
        $("#quarryType").val(violationData.QuarryType).trigger("change");
        $("#quarryCode").val(violationData.QuarryCode);
        $("#violatorMobileNumber").val(violationData.MobileNumber || "");

        violationData.Equipments.forEach((equipment, index) => {
          let selectedInput = $(`label[for="${equipment.Name}"]`);
          selectedInput.trigger("click");
          selectedInput.siblings("#toolCount").val(violationData.Equipments_Count[index].count);
        });
        $("#violationDepth").val(violationData.Depth);
        $("#AreaSpace").val(violationData.Area);
        $(".totalAreaSpace").val(
          ($("#violationDepth").val() * $("#AreaSpace").val()).toFixed(3)
        );
        $("#distanceToNearQuarry").val(violationData.DistanceToNearestQuarry);
        $("#NearestQuarryNumber").val(violationData.NearestQuarryCode);
        $("#s4-workspace").scrollTop(0, 0);

        if (urlParams.get("isViolationEdit") === "true") {
          Promise.resolve(commonEditResult).then(() => equipmentViolation.captureOriginalData());
        }
        $(".overlay").removeClass("active");
      });
  }
};
// Runs fn without showing validation alerts (used only for the baseline snapshot)
const withSilentAlerts = (fn) => {
  const original = functions.warningAlert;
  functions.warningAlert = () => { };
  try {
    return fn();
  } finally {
    functions.warningAlert = original;
  }
};
// Builds the full payload (edit flow only)
equipmentViolation.buildViolationEditData = (sections, sectorMembers, isCalculateByTon) => {
  const { violator, violation, dimensions, other } = sections;

  let violationDate, violationTime;
  if (violation && violation.violationDate) {
    const d = violation.violationDate.split("/");
    violationDate = `${d[1]}-${d[0]}-${d[2]}`;
    const t = violation.violationTime.split("/");
    violationTime = `${t[1]}-${t[0]}-${t[2]}`;
  }

  const data = {
    ID: editViolationId,
    IsEdit: false,
    IsRejectedBefore: false,
    IsViolationEdit: true,

    Title: "New Equipment Violation",
    OffenderType: "Equipment",
    ViolatorName: violator?.violatorName,
    NationalID: violator?.violatorNationalId,
    MobileNumber: violator?.violatorMobileNumber,
    NumOfPreviousViolations: violator?.violationPrevCount,
    ViolatorCompany: violator?.companyName,
    CommercialRegister: violator?.commercialRegister,
    VehicleIdentificationNumber: violator?.vehicleIdentificationNumber || "",
    Governrate: violator?.violationGov,
    ViolationsZone: violator?.violationAreaName,

    ViolationType: 19,
    BonsNumber: violation?.isBonesViolation ? violation.BonsNumber : 0,
    MaterialType: violation?.violationMaterail,
    ViolationDate: violationDate,
    ViolationTime: violationTime,
    QuarryType: violation?.quarryType,
    QuarryCode: violation?.quarryCode,
    Equipments: violation?.selectedEquipementsIds,
    EquipmentsCount: violation?.selectedEquipmentsData,

    SkipCalculation: isPresidencyUser ? true : false,
    Depth: dimensions?.violationDepth,
    Area: dimensions?.violationAreaSpace,
    TotalQuantity: isPresidencyUser ? 0 : dimensions?.violationQuantity,
    DistanceToNearestQuarry: dimensions?.distanceToNearQuarry,
    NearestQuarryCode: dimensions?.NearestQuarryCode,
    Coordinates: dimensions?.coordinates,
    CoordinatesDegrees: dimensions?.coordinatesDegrees,

    Description: other?.violationDescription,
    LeaderOpinion: other?.violationLeaderOpinion,
    CommiteeMember: other?.membersNamesText ? other.membersNamesText : "-",
    SectorMembers: sectorMembers,
    Sector: 0,
  };

  if (isCalculateByTon) {
    data.MaterialUnit = "طن";
  }

  return data;
};
// Reads the 4 form sections (edit flow only)
equipmentViolation.collectViolationEditSections = () => ({
  other: equipmentViolation.otherViolationDetails(),
  dimensions: equipmentViolation.violationDimensionsCoordsDetails(),
  violation: equipmentViolation.violationDetails(),
  violator: equipmentViolation.violatorDetails(),
});
// Snapshot of the form right after it was filled with the saved data
equipmentViolation.captureOriginalData = () => {
  originalViolationData = withSilentAlerts(() => {
    const sections = equipmentViolation.collectViolationEditSections();
    if (Object.values(sections).some((s) => s === false)) {
      console.warn("Edit snapshot: some sections are invalid, fields may be reported as changed", sections);
    }
    return equipmentViolation.buildViolationEditData(
      sections,
      $(".membersText").val(),
      $("#calculateByTon").is(":checked")
    );
  });
};
// Returns only the fields that changed compared to the snapshot
equipmentViolation.getChangedData = (current) => {
  if (!originalViolationData) return current; // safety: fall back to full data

  const alwaysSend = ["ID", "Title", "OffenderType", "IsEdit", "IsRejectedBefore", "IsViolationEdit"];
  const result = {};
  const changedFields = [];
  const keys = new Set([...Object.keys(current), ...Object.keys(originalViolationData)]);

  alwaysSend.forEach((k) => (result[k] = current[k]));

  keys.forEach((key) => {
    if (alwaysSend.includes(key)) return;
    if (JSON.stringify(current[key]) !== JSON.stringify(originalViolationData[key])) {
      result[key] = current[key] === undefined ? "" : current[key];
      changedFields.push(key);
    }
  });

  console.log("changedFields", changedFields);
  return result;
};
// Validation + submit for isViolationEdit=true only
equipmentViolation.validateViolationEditForm = (e) => {
  let attachecdFiles = $("#attachViolationFiles")[0].files;
  let attachecdReportFiles = $("#attachViolationReportFile")[0].files;

  let sections = equipmentViolation.collectViolationEditSections();
  let SectorMembers = $(".membersText").val();
  let isCalculateByTon = $("#calculateByTon").is(":checked");

  if (SectorMembers == "") {
    functions.warningAlert("من فضلك قم بادخال اعضاء اللجنة");
    return;
  }
  if (!sections.violator || !sections.violation || !sections.dimensions) return;

  if (!attachecdFiles || attachecdFiles.length === 0) {
    functions.warningAlert("من فضلك قم بإرفاق أصل محضر الضبط", "#attachViolationFiles");
    return;
  }
  if (!attachecdReportFiles || attachecdReportFiles.length === 0) {
    functions.warningAlert("من فضلك قم بإرفاق التقرير المصور", "#attachViolationReportFile");
    return;
  }
  if (!sections.other) return;

  let isOldFilesRequired = $("#oldFilesBox").is(":visible");
  let attachedOldFiles = $("#attachOldFiles")[0]?.files || [];
  if (isOldFilesRequired && attachedOldFiles.length === 0) {
    functions.warningAlert("من فضلك قم بإرفاق الملفات القديمة", "#attachOldFiles");
    return;
  }

  let currentData = equipmentViolation.buildViolationEditData(sections, SectorMembers, isCalculateByTon);
  let changedData = equipmentViolation.getChangedData(currentData);

  equipmentViolation.submitNewViolation(e, changedData);
};
///////////////////////////////////////
export default equipmentViolation;
