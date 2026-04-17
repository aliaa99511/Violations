// import $ from "jquery";
// import $ from './Libraries/jquery'
//var dt = require("datatables.net")(window, $);
// import Swal from 'sweetalert2';
import bootpopup from "./Libraries/bootpopup";
import functions from "./Shared/functions";
import sharedApis from "./Shared/sharedApiCall";

// Modules ----------------------------------------------------------------
import home from "./Modules/Home";
import quarryViolation from "./Modules/ViolationsRecorder/quarryViolationForm";
import equipmentViolation from "./Modules/ViolationsRecorder/equipmentViolationForm";
import carViolation from "./Modules/ViolationsRecorder/carViolations";
import registeredViolationsRecords from "./Modules/ViolationsRecorder/registeredViolationsRecords";
import approvedViolationsRecords from "./Modules/ViolationsRecorder/approvedViolationsRecords";
import rejectedViolationsRecords from "./Modules/ViolationsRecorder/rejectedViolationsRecords";
import validatedViolationsRecords from "./Modules/ViolationsRecorder/validatedViolationsRecords";
import PendingViolations from "./Modules/ViolationsBranch/PendingViolations";
import runningViolations from "./Modules/ViolationsBranch/RunningViolations";
import validatedViolations from "./Modules/ViolationsBranch/ValidatedViolations";
// import completedViolations from "./Modules/ViolationsBranch/completedViolations";
import rejectedViolations from "./Modules/ViolationsBranch/RejectedViolations";
import violationsCases from "./Modules/ViolationsBranch/ViolationsCases";
import runningSectorTask from "./Modules/SectorManager/RunningTasks";
import confirmedViolationLog from "./Modules/SectorManager/ConfirmedViolationLog";
import certificationCases from "./Modules/SectorManager/CertificationViolationsCases";
import prevViolations from "./Shared/prevViolations";
import petitionsLog from "./Shared/petitionslog";
import pagination from "./Shared/Pagination";
import sideMenuFunctions from "./Modules/sideMenu";
import externalViolationForm from "./Modules/ViolationsBranch/ExternalViolationForm";
import pendingPayment from "./Modules/ViolationsBranch/PendingPaymentLog";
import vehicleViolationReferral from "./Modules/ViolationsBranch/CarViolationReferral";
import quarryViolationReferral from "./Modules/ViolationsBranch/QuarryViolationReferral";
import quarryViolationReferralRecords from "./Modules/ViolationsRecorder/QuarryViolationReferralRecords";
import vehicleViolationReferralRecords from "./Modules/ViolationsRecorder/CarViolationReferralRecords";
import ExternalViolationLog from "./Modules/ViolationsBranch/ExternalViolationLog";
import pendingPaymentRecords from "./Modules/ViolationsRecorder/PendingPaymentRecords";
import vehicleViolationReferralSector from "./Modules/SectorManager/CarViolationReferralSector";
import quarryViolationReferralSector from "./Modules/SectorManager/QuarryViolationReferralSector";

$(".PreLoader").addClass("active");
$(window).on("load", () => {

  if (typeof window.SP_CONNECTION !== "undefined" && !window.SP_CONNECTION) {

    $(".PreLoader").addClass("active");

    Swal.fire({
      icon: "error",
      title: "SharePoint Disconnected",
      text: "V: drive is not connected. Please reconnect.",
      confirmButtonText: "OK"
    });

  } else {
    $(".PreLoader").removeClass("active");
  }

  if (document.readyState == "complete") {
    sideMenuFunctions.init();

    if (functions.getSiteName() === "Home") {
      $(".PreLoader").find("span").addClass("greenLoader");
      // $(".PreLoader").addClass("active");
      $("#s4-workspace").addClass("greenScroller");
      home.redirectUser();
    }
    if (functions.getSiteName() === "ViolationsRecorder") {
      sharedApis.getUserDetails();
      $(".SideMenu")
        .find(".userBackImageBox")
        .children("img")
        .attr("src", "/Style Library/MiningViolations/images/blueSideMenu.png");
      $(".SideMenu").addClass("blueMunu");
      $(".header").addClass("blueHeader");
      $(".header")
        .find(".userDetailsImg")
        .children("img")
        .attr("src", "/Style Library/MiningViolations/images/userIconBlue.png");
      $(".PreLoader").find("span").addClass("blueLoader");
      // $(".PreLoader").addClass("active");
      $("#s4-workspace").addClass("blueScroller");
      // $(".popupHeader").find(".printBtn").children("img").attr("src","/Style Library/MiningViolations/images/BluePrintBtn.png")

      if (functions.getPageName() === "QuarryForm") {
        functions.setPageMetaData("محضر ضبط محجر مخالف");
        quarryViolation.formActions();
        quarryViolation.editViolation();
      }
      if (functions.getPageName() === "CarForm") {
        functions.setPageMetaData("محضر ضبط عربة مخالفة");
        carViolation.formActions();
        carViolation.editViolation();
      }
      if (functions.getPageName() === "EquipmentForm") {
        functions.setPageMetaData("محضر ضبط معدة مخالفة");
        equipmentViolation.formActions();
        equipmentViolation.editViolation();
      }
      if (functions.getPageName() === "prevViolationsQueryLog") {
        $(".PreLoader").removeClass("active");
        functions.setPageMetaData("الاستعلام عن المخالفات السابقة");
        prevViolations.dashBoardTable();
        $(".filterBox").find("#violatorNationalId").on("keypress", (e) => {
          return functions.isNumberKey(e);
        });
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          prevViolations.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          prevViolations.resetFilter(e);
        });
      }
      if (functions.getPageName() === "RegisteredViolationsRecords") {
        functions.setPageMetaData("سجل المحاضر المسجلة");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");
        sharedApis.getViolationSectors("#violationSector");
        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        registeredViolationsRecords.handleViolationCategoryChange();

        registeredViolationsRecords.getRegisteredViolations();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          registeredViolationsRecords.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          registeredViolationsRecords.resetFilter(e);
        });
      }
      if (functions.getPageName() === "ApprovedViolationsRecords") {
        functions.setPageMetaData("سجل المحاضر الموافق عليها");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");

        approvedViolationsRecords.handleViolationCategoryChange()

        approvedViolationsRecords.getApprovedViolations();

        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          approvedViolationsRecords.filterViolationsLog(e);
        });

        $(".resetBtn").on("click", (e) => {
          approvedViolationsRecords.resetFilter(e);
        });
      }
      if (functions.getPageName() === "ValidatedViolationsRecordsLog") {
        functions.setPageMetaData("سجل المحاضر المصدق عليها");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");
        sharedApis.getViolationSectors("#violationSector");

        // sharedApis.getPaymentStatus("#PaymentStatus");
        sharedApis.getViolationStatus("#ViolationStatus");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        validatedViolationsRecords.handleViolationCategoryChange()

        validatedViolationsRecords.getViolations();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          validatedViolationsRecords.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          validatedViolationsRecords.resetFilter(e);
        });
      }
      if (functions.getPageName() === "RejectedViolationsRecordsLog") {
        functions.setPageMetaData("سجل المخالفات المرفوضة");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getViolationType("#TypeofViolation");

        rejectedViolationsRecords.getViolations();

        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          rejectedViolationsRecords.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          rejectedViolationsRecords.resetFilter(e);
        });
      }
      if (functions.getPageName() === "QuarryViolationReferralRecords") {
        functions.setPageMetaData("إحالة مخالفة محجرية");

        sharedApis.getCasesStatus("#CaseStatus");
        sharedApis.getQuarryViolationStatus("#ViolationStatus");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#RefferedDateFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#RefferedDateTo", "", "", "dd-mm-yyyy");

        quarryViolationReferralRecords.getQuarryViolationReferralsRecords();

        // Setup search button
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          quarryViolationReferralRecords.filterQuarryViolationReferralsRecords(e);
        });
        $(".resetBtn").on("click", (e) => {
          quarryViolationReferralRecords.resetFilter(e);
        });
      }
      if (functions.getPageName() === "VehicleViolationReferralRecords") {
        functions.setPageMetaData("حظر عربة/معدة");

        // Initialize datepickers AFTER DOM is ready
        functions.inputDateFormat("#RefferedDateFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#RefferedDateTo", "", "", "dd-mm-yyyy");

        sharedApis.getCasesStatus("#CaseStatus");
        sharedApis.getVehicleViolationStatus("#ViolationStatus");

        // Call the API to get data
        vehicleViolationReferralRecords.getVehicleViolationReferralsRecords();

        // Setup search button
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          vehicleViolationReferralRecords.filterVehicleViolationReferralsRecords(e);
        });

        $(".resetBtn").on("click", (e) => {
          vehicleViolationReferralRecords.resetFilter(e);
        });
      }
      if (functions.getPageName() === "PendingPaymentRecordsLog") {
        functions.setPageMetaData("سجل المخالفات قيد السداد");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        pendingPaymentRecords.handleViolationCategoryChange()

        pendingPaymentRecords.getPendingPayment();

        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          pendingPaymentRecords.filterPaymentsLog(e);
        });

        $(".resetBtn").on("click", (e) => {
          pendingPaymentRecords.resetFilter(e);
        });
      }
      if (functions.getPageName() === "DashBoard") {
        functions.setPageMetaData("الصفحة الرئيسية");
        $(".PreLoader").removeClass("active");
      }
    }
    if (functions.getSiteName() === "ViolationsBranch") {
      sharedApis.getUserDetails();
      $(".SideMenu")
        .find(".userBackImageBox")
        .children("img")
        .attr(
          "src",
          "/Style Library/MiningViolations/images/greenSideMenu.png",
        );
      $(".SideMenu").addClass("greenMunu");
      $(".header").addClass("greenHeader");
      $(".header")
        .find(".userDetailsImg")
        .children("img")
        .attr(
          "src",
          "/Style Library/MiningViolations/images/userIconGreen.png",
        );
      $(".PreLoader").find("span").addClass("greenLoader");
      // $(".PreLoader").addClass("active");
      $("#s4-workspace").addClass("greenScroller");
      // $(".popupHeader").find(".printBtn").children("img").attr("src","/Style Library/MiningViolations/images/GreenPrintBtn.png")

      if (functions.getPageName() === "PendingViolations") {
        functions.setPageMetaData("سجل المخالفات قيد الانتظار");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        PendingViolations.handleViolationCategoryChange();

        PendingViolations.getPendingViolations();

        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          PendingViolations.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          PendingViolations.resetFilter(e);
        });
      }
      if (functions.getPageName() === "ValidatedViolations") {
        functions.setPageMetaData("سجل المخالفات المصدق عليها");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getViolationType("#TypeofViolation");
        sharedApis.getOffenderType("#violationCategory");
        // sharedApis.getPaymentStatus("#PaymentStatus");
        sharedApis.getViolationStatus("#ViolationStatus");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        validatedViolations.handleViolationCategoryChange()

        validatedViolations.getValidatedViolations();

        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          validatedViolations.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          validatedViolations.resetFilter(e);
        });
      }
      if (functions.getPageName() === "RejectedViolations") {
        functions.setPageMetaData("سجل المخالفات المرفوضة");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getViolationType("#TypeofViolation");

        rejectedViolations.getRejectedViolations();

        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          rejectedViolations.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          rejectedViolations.resetFilter(e);
        });
      }
      if (functions.getPageName() === "RunningViolations") {
        functions.setPageMetaData("سجل المخالفات القائمة");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        runningViolations.handleViolationCategoryChange()

        runningViolations.getRunningViolations();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          runningViolations.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          runningViolations.resetFilter(e);
        });
      }
      if (functions.getPageName() === "prevViolationsQueryLog") {
        $(".PreLoader").removeClass("active");
        functions.setPageMetaData("الاستعلام عن المخالفات السابقة");
        prevViolations.dashBoardTable();
        $(".filterBox").find("#violatorNationalId").on("keypress", (e) => {
          return functions.isNumberKey(e);
        });
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          prevViolations.filterViolationsLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          prevViolations.resetFilter(e);
        });
      }
      if (functions.getPageName() === "CasesLog") {
        functions.setPageMetaData("سجل القضايا");
        violationsCases.getViolationsCases();
        sharedApis.getCasesStatus("#CaseStatus");
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          violationsCases.filterViolationsLog(e);
        });
      }

      if (functions.getPageName() === "PendingPetitionsLog") {
        $(".PreLoader").find("span").addClass("greenLoader");
        $(".PreLoader").addClass("active");
        functions.setPageMetaData("سجل الإلتماسات قيد الإنتظار");

        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getPetitionsStatus("#petitionStatus");
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        petitionsLog.handleViolationCategoryChange()

        // Initial load with pending status
        petitionsLog.getPetitions("التماس قيد الإنتظار", 1, false);

        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          petitionsLog.filterPetitionsLog(e, "التماس قيد الإنتظار");
        });

        $(".resetBtn").on("click", (e) => {
          petitionsLog.resetFilter(e, "التماس قيد الإنتظار");
        });
      }

      if (functions.getPageName() === "PetitionsLog") {
        $(".PreLoader").find("span").addClass("greenLoader");
        $(".PreLoader").addClass("active");
        functions.setPageMetaData("سجل الالتماسات");

        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getPetitionsStatus("#petitionStatus");
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        petitionsLog.handleViolationCategoryChange()

        // Initial load with all petitions
        petitionsLog.getPetitions("All", 1, false);

        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          petitionsLog.filterPetitionsLog(e, "All");
        });

        $(".resetBtn").on("click", (e) => {
          petitionsLog.resetFilter(e, "All");
        });
      }
      if (functions.getPageName() === "ExternalViolationForm") {
        functions.setPageMetaData("إنشاء مخالفات ضبط خارجية");
        externalViolationForm.init();
      }
      if (functions.getPageName() === "ExternalViolationLog") {
        functions.setPageMetaData("سجل مخالفات ضبط خارجية");

        // sharedApis.getViolationSectors("#violationSector");
        // sharedApis.getOffenderType("#violationCategory");
        // sharedApis.getViolationType("#TypeofViolation");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        // Call init instead of getExternalViolations directly
        // ExternalViolationLog.init(); // This will setup events AND call the API
        ExternalViolationLog.getExternalViolations();

        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          ExternalViolationLog.filterExternalViolations(e);
        });
        $(".resetBtn").on("click", (e) => {
          ExternalViolationLog.resetFilter(e);
        });
      }
      if (functions.getPageName() === "pendingPaymentLog") {
        functions.setPageMetaData("سجل المخالفات قيد السداد");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getViolationType("#TypeofViolation");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        pendingPayment.handleViolationCategoryChange()

        pendingPayment.getPendingPayment();

        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          pendingPayment.filterPaymentsLog(e);
        });

        $(".resetBtn").on("click", (e) => {
          // e.preventDefault();
          pendingPayment.resetFilter(e);
        });
      }
      if (functions.getPageName() === "QuarryViolationReferralLog") {
        functions.setPageMetaData("إحالة مخالفة محجرية");

        sharedApis.getCasesStatus("#CaseStatus");
        sharedApis.getQuarryViolationStatus("#ViolationStatus");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#RefferedDateFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#RefferedDateTo", "", "", "dd-mm-yyyy");

        quarryViolationReferral.getQuarryViolationReferrals();

        // Setup search button
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          quarryViolationReferral.filterQuarryViolationReferrals(e);
        });
        $(".resetBtn").on("click", (e) => {
          quarryViolationReferral.resetFilter(e);
        });
        // // Setup form submission on Enter
        // $(".filterBox input").on("keypress", function (e) {
        //   if (e.which === 13) {
        //     quarryViolationReferral.filterQuarryViolationReferrals(e);
        //   }
        // });
      }
      if (functions.getPageName() === "VehicleViolationReferralLog") {
        functions.setPageMetaData("حظر عربة/معدة");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#RefferedDateFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#RefferedDateTo", "", "", "dd-mm-yyyy");

        // Load status dropdown first
        sharedApis.getCasesStatus("#CaseStatus");
        sharedApis.getVehicleViolationStatus("#ViolationStatus");

        vehicleViolationReferral.getVehicleViolationReferrals();

        // Setup search button
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          vehicleViolationReferral.filterVehicleViolationReferrals(e);
        });

        $(".resetBtn").on("click", (e) => {
          vehicleViolationReferral.resetFilter(e);
        });
      }
      if (functions.getPageName() === "DashBoard") {
        functions.setPageMetaData("الصفحة الرئيسية");
        $(".PreLoader").removeClass("active");
      }
    }
    if (functions.getSiteName() === "CertificationOfficer") {
      sharedApis.getUserDetails();
      $(".SideMenu")
        .find(".userBackImageBox")
        .children("img")
        .attr(
          "src",
          "/Style Library/MiningViolations/images/greenSideMenu.png",
        );
      $(".SideMenu").addClass("greenMunu");
      $(".header").addClass("greenHeader");
      $(".header")
        .find(".userDetailsImg")
        .children("img")
        .attr(
          "src",
          "/Style Library/MiningViolations/images/userIconGreen.png",
        );
      $(".PreLoader").find("span").addClass("greenLoader");
      // $(".PreLoader").addClass("active");
      $("#s4-workspace").addClass("greenScroller");

      if (functions.getPageName() === "RunningTasks") {
        functions.setPageMetaData(" سجل المخالفات القائمة");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getViolationType("#TypeofViolation");

        runningSectorTask.getRunningTasks();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          runningSectorTask.filterTasksLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          runningSectorTask.resetFilter(e);
        });
      }
      if (functions.getPageName() === "ConfirmedViolation") {
        functions.setPageMetaData(" سجل المخالفات المصدق عليها");
        // sharedApis.getViolationZones("#violationZone");
        sharedApis.getViolationSectors("#violationSector");
        sharedApis.getViolationType("#TypeofViolation");
        sharedApis.getOffenderType("#violationCategory");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        confirmedViolationLog.handleViolationCategoryChange()

        confirmedViolationLog.getConfirmedLog();
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          confirmedViolationLog.filterConfirmedLog(e);
        });
        $(".resetBtn").on("click", (e) => {
          confirmedViolationLog.resetFilter(e);
        });
      }
      if (functions.getPageName() === "CertificationCasesLog") {
        functions.setPageMetaData("سجل القضايا");
        certificationCases.getViolationsCases();
        sharedApis.getCasesStatus("#CaseStatus");
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          certificationCases.filterViolationsLog(e);
        });
      }
      if (functions.getPageName() === "PendingPetitionsLog") {
        $(".PreLoader").find("span").addClass("greenLoader");
        $(".PreLoader").addClass("active");
        functions.setPageMetaData("سجل الإلتماسات قيد الإنتظار");

        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getPetitionsStatus("#petitionStatus");
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        petitionsLog.handleViolationCategoryChange()

        // Initial load with pending status
        petitionsLog.getPetitions("التماس قيد الإنتظار", 1, false);

        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          petitionsLog.filterPetitionsLog(e, "التماس قيد الإنتظار");
        });

        $(".resetBtn").on("click", (e) => {
          petitionsLog.resetFilter(e, "التماس قيد الإنتظار");
        });
      }
      if (functions.getPageName() === "PetitionsLog") {
        $(".PreLoader").find("span").addClass("greenLoader");
        $(".PreLoader").addClass("active");
        functions.setPageMetaData("سجل الالتماسات");

        sharedApis.getOffenderType("#violationCategory");
        sharedApis.getPetitionsStatus("#petitionStatus");
        functions.inputDateFormat("#createdFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#createdTo", "", "", "dd-mm-yyyy");

        petitionsLog.handleViolationCategoryChange()

        // Initial load with all petitions
        petitionsLog.getPetitions("All", 1, false);

        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          petitionsLog.filterPetitionsLog(e, "All");
        });

        $(".resetBtn").on("click", (e) => {
          petitionsLog.resetFilter(e, "All");
        });
      }
      if (functions.getPageName() === "QuarryViolationReferralSector") {
        functions.setPageMetaData("إحالة مخالفة محجرية");

        sharedApis.getCasesStatus("#CaseStatus");
        sharedApis.getQuarryViolationStatus("#ViolationStatus");

        // Initialize datepickers for date inputs
        functions.inputDateFormat("#RefferedDateFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#RefferedDateTo", "", "", "dd-mm-yyyy");

        // First load
        quarryViolationReferralSector.getQuarryViolationReferralsRecords();

        // Search
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          quarryViolationReferralSector.filterQuarryViolationReferralsRecords(e);
        });

        // Reset
        $(".resetBtn").on("click", (e) => {
          quarryViolationReferralSector.resetFilter(e);
        });
      }
      if (functions.getPageName() === "VehicleViolationReferralSector") {
        functions.setPageMetaData("حظر عربة/معدة");

        // Initialize datepickers
        functions.inputDateFormat("#RefferedDateFrom", "", "", "dd-mm-yyyy");
        functions.inputDateFormat("#RefferedDateTo", "", "", "dd-mm-yyyy");

        sharedApis.getCasesStatus("#CaseStatus");
        sharedApis.getVehicleViolationStatus("#ViolationStatus");

        // Call the API to get data
        vehicleViolationReferralSector.getVehicleViolationReferralsRecords();

        // Setup search button
        $(".searchBtn").on("click", (e) => {
          e.preventDefault();
          pagination.reset();
          vehicleViolationReferralSector.filterVehicleViolationReferralsRecords(e);
        });

        $(".resetBtn").on("click", (e) => {
          vehicleViolationReferralSector.resetFilter(e);
        });
      }


    }
  }
});









