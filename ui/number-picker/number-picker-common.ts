import * as definition from "ui/number-picker";
import {View} from "ui/core/view";
import {Property, PropertyMetadataSettings} from "ui/core/dependency-observable";
import {PropertyMetadata} from "ui/core/proxy";

var TYPE = "NumberPicker";

export class NumberPicker extends View implements definition.NumberPicker {
    public static valueProperty = new Property(
        "value",
        TYPE,
        new PropertyMetadata(0, PropertyMetadataSettings.AffectsLayout)
        );

    public static maxValueProperty = new Property(
        "maxValue",
        TYPE,
        new PropertyMetadata(100, PropertyMetadataSettings.AffectsLayout)
        );

    public static minValueProperty = new Property(
        "minValue",
        TYPE,
        new PropertyMetadata(0, PropertyMetadataSettings.AffectsLayout)
        );

    constructor() {
        super();

        this.maxValue = 100;
        this.minValue = 0;
        this.value = 0;
    }

    get maxValue(): number {
        return this._getValue(NumberPicker.maxValueProperty);
    }
    set maxValue(newMaxValue: number) {
        this._setValue(NumberPicker.maxValueProperty, newMaxValue);

        // Adjust value if needed.
        if (this.value > newMaxValue) {
            this.value = newMaxValue;
        }
    }

    get value(): number {
        return this._getValue(NumberPicker.valueProperty);
    }
    set value(value: number) {
        value = Math.min(value, this.maxValue);
        value = Math.max(value, this.minValue);
        this._setValue(NumberPicker.valueProperty, value);
    }

    get minValue(): number {
        return this._getValue(NumberPicker.minValueProperty);
    }
    set minValue(newMinValue: number) {
        newMinValue = Math.min(newMinValue, this.maxValue);
        this._setValue(NumberPicker.minValueProperty, newMinValue);

        if (this.value < newMinValue) {
            this.value = newMinValue;
        }
    }
} 