/**
 * Contains the NumberPicker widget, which enables users to pick numeric values through built-in native widgets.
 */
declare module "ui/number-picker" {
    import view = require("ui/core/view");
    import dependencyObservable = require("ui/core/dependency-observable");

    export class NumberPicker extends view.View {
        /**
         * Represents the observable property backing the value property of each Progress instance.
         */
        public static valueProperty: dependencyObservable.Property;

        /**
         * Represents the observable property backing the maxValue property of each Progress instance.
         */
        public static maxValueProperty: dependencyObservable.Property;

        /**
         * Represents the observable property backing the maxValue property of each Progress instance.
         */
        public static minValueProperty: dependencyObservable.Property;

        value: number;

        minValue: number;

        maxValue: number;

        /**
         * Gets the native [Android widget](http://developer.android.com/reference/android/widget/NumberPicker.html) that represents the user interface for this component. Valid only when running on Android OS.
         */
        android: android.widget.NumberPicker;

        /**
         * Gets the native [iOS widget](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIStepper_Class/index.html#//apple_ref/occ/cl/UIStepper) that represents the user interface for this component. Valid only when running on iOS.
         */
        ios: UIStepper;
    }
} 