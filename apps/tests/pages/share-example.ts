import frame = require("ui/frame");
import view = require("ui/core/view");
import utils = require("utils/utils");
import platform = require("platform");

export function shareTap(args) {
    share("here we go");
}

function share(text: string) {
    if (platform.device.os === platform.platformNames.android) {
        var intent = new android.content.Intent(android.content.Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(android.content.Intent.EXTRA_SUBJECT, "subject");
        intent.putExtra(android.content.Intent.EXTRA_TEXT, text);

        var activity = frame.topmost().android.activity;
        activity.startActivity(android.content.Intent.createChooser(intent, "share"));
    }
    else if (platform.device.os === platform.platformNames.ios){
        var currentPage = frame.topmost().currentPage;

        var controller = new UIActivityViewController(utils.ios.collections.jsArrayToNSArray([text]), null);

        (<UIViewController>currentPage.ios).presentViewControllerAnimatedCompletion(controller, true, null);
    }
}
