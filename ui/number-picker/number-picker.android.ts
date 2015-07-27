import * as common from "ui/number-picker/number-picker-common";
import * as dependencyObservable from "ui/core/dependency-observable";
import * as proxy from "ui/core/proxy";

function onValuePropertyChanged(data: dependencyObservable.PropertyChangeData) {
    var picker = <NumberPicker>data.object;
    if (!picker.android) {
        return;
    }

    picker.android.setValue(data.newValue);
}

// register the setNativeValue callbacks
(<proxy.PropertyMetadata>common.NumberPicker.valueProperty.metadata).onSetNativeValue = onValuePropertyChanged;

// merge the exports of the common file with the exports of this file
require("utils/module-merge").merge(common, module.exports);

export class NumberPicker extends common.NumberPicker {
    private _android: android.widget.NumberPicker;

    public _createUI() {
        this._android = new android.widget.NumberPicker(this._context);
    }

    get android(): android.widget.NumberPicker {
        return this._android;
    }
}
 