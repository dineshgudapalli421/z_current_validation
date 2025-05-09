sap.ui.define([
   "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    "sap/ui/model/json/JSONModel",
    'sap/m/MessageBox',
    "sap/ui/core/format/DateFormat",
    'sap/ui/model/type/String',
], (Controller, ODataModel, Filter, FilterOperator, JSONModel, MessageBox, DateFormat, TypeString) => {
    "use strict";

    return Controller.extend("com.sap.lh.mr.zcurrentvalidation.controller.Main", {
        onInit() {
            const oView = this.getView();
            oView.setModel(new JSONModel({
				rowMode: "Fixed"
			}), "ui");
            this._oAmsMultiInput = this.byId("idAms");

        },
        onSearch: function () {
            const oView = this.getView();
            var equipment = this.getView().byId("idEquipment").getValue();
            var aTokens = this.getView().byId("idAms").getTokens();
            var amsValue = "";
            var aFilter = [];
            if (aTokens.length === 0 && equipment === "") {
                return MessageBox.error("Either AMS or Equipment are mandatory...");
            }
            else if (aTokens.length === 1) {
                amsValue = aTokens[0].getText();
                amsValue = amsValue.replace("=", "");
                aFilter.push(new Filter("AMS", FilterOperator.EQ, amsValue));
            }
            else if (aTokens.length === 2) {
                //return MessageBox.error("Select only one ams...");
                var amsValue1 = aTokens[0].getText();
                amsValue1 = amsValue1.replace("=", "");
                var amsValue2 = aTokens[1].getText();
                amsValue2 = amsValue2.replace("=", "");
                aFilter.push(new Filter("AMS", FilterOperator.BT, amsValue1, amsValue2));

            }
            else if (aTokens.length > 2) {
                //return MessageBox.error("Select only one ams...");               
                for (let i = 0; i <= aTokens.length - 1; i++) {
                    amsValue = aTokens[i].getText();
                    amsValue = amsValue.replace("=", "");
                    aFilter.push(new Filter("AMS", FilterOperator.EQ, amsValue));
                }
            }
            
            if (equipment !== "") {
                aFilter.push(new Filter("Equipment", FilterOperator.EQ, equipment));
            }

            var periodFrom = this.getView().byId("idDTP1").getValue();

            var periodTo = this.getView().byId("idDTP2").getValue();
            if (periodFrom === "" || periodTo === "") {
                return MessageBox.error("Period From and Period To are mandatatory...");
            }
            var fromDate = this.getDateFormat(this.byId("idDTP1").getDateValue());
            var toDate = this.getDateFormat(this.byId("idDTP2").getDateValue());

           
           

            aFilter.push(new Filter("Date", FilterOperator.BT, fromDate, toDate));
            var oModel = this.getOwnerComponent().getModel();
            var oJsonModel = new sap.ui.model.json.JSONModel();
            var oBusyDialog = new sap.m.BusyDialog({
                title: "Loading Data",
                text: "Please wait..."
            });
            oBusyDialog.open();
            oModel.read("/OutputSet", {
                filters: aFilter,
                success: function (response) {
                    oBusyDialog.close();
                    oJsonModel.setData(response.results);
                    oView.byId("idTableCurrVal").setModel(oJsonModel, "CurrentValidationModel");
                },
                error: (oError) => {
                    oBusyDialog.close();
                    console.error("Error:", oError);
                }
            });
        },
        getDateFormat: function (strDate) {
            var oDateFormat = DateFormat.getDateTimeInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" });
            var formatDate = oDateFormat.format(strDate);
            return formatDate;
            //return "datetime" + formatDate ;
        },
        onAmsVHRequested: function () {
			this._oAmsMultiInput = this.byId("idAms");
			this.loadFragment({
				name: "com.sap.lh.mr.zcurrentvalidation.fragment.ams"
			}).then(function (oDialog) {
				this._oAmsDialog = oDialog;
                this.getView().addDependent(oDialog);
				oDialog.setRangeKeyFields([{
					label: "AMS",
					key: "Ams",
					type: "string",
					typeInstance: new TypeString({}, { maxLength: 10 })
				}]);
				oDialog.setTokens(this._oAmsMultiInput.getTokens());
				oDialog.open();
			}.bind(this));
		},
		onAmsVHOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			this._oAmsMultiInput.setTokens(aTokens);
			this._oAmsDialog.close();
		},
		onAmsVHCancelPress: function () {
			this._oAmsDialog.close();
		},
		onAmsVHAfterClose: function () {
			this._oAmsDialog.destroy();
		},
    });
});