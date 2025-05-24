// Basic functions
function generate_random_number(max_number) {
    return Math.floor(Math.random() * max_number) + 1;
}

function current_time_str() { //Create the time str for the current time in the format of "05/20/2025, 01:47:33 PM"
    let now = new Date();

    let time_str = now.toLocaleString(
        [],
        {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }
    )

    return time_str;
}

function basic_widget_ini() { //Initiate a widget instance, so you can add elements onto it
    let widget = new ListWidget();
    widget.backgroundColor = new Color('#1e1e1e');
    widget.setPadding(16, 16, 16, 16);

    return widget;
}

function show_widget(widget) { //Show the widget
    if (config.runsInWidget) {
        Script.setWidget(widget);
    } else {
        widget.presentLarge();
    }
}

function auto_refresh_widget(input_widget, minute_int) { //Automatically schedule a widget for refresh. ChatGpt said that minute_int >= 5, so the quickest is to update every 5 min
//How the refresh work is quite intersting in IOS. The property indicates when the widget can be refreshed again. The widget will not be refreshed before the date have been reached. It is not guaranteed that the widget will refresh at exactly the specified date.
//The refresh rate of a widget is partly up to iOS/iPadOS. For example, a widget may not refresh if the device is low on battery or the user is rarely looking at the widget.

    input_widget.refreshAfterDate = new Date(Date.now() + minute_int * 60 * 1000);
}


// Worker functions
function alert_in_widget(alert_title, alert_msg, alert_detail = '') {//Display an alert in the widget since widget doesn't support real alerts
    let widget = basic_widget_ini();

    let title = widget.addText(alert_title);
    if (alert_title === 'Error' || alert_title === 'Missing API key') {
        title.textColor = Color.red();
    } else {
        title.textColor = Color.gray();
    }
    title.font = Font.mediumSystemFont(14);

    let widget_msg = widget.addText(alert_msg);
    let widget_msg_detail = widget.addText(alert_detail);

    if (alert_title === 'Error' || alert_title === 'Missing API key') {
        for (let msg of [widget_msg, widget_msg_detail]) {
            msg.textColor = Color.red();
            msg.font = Font.boldSystemFont(28);
        }
    }

    show_widget(widget);
    Script.complete();
}

function handle_api_error(e) { //Handle API calling errors
    alert_in_widget('Error', 'API call failed', e);
}

function waiting_widget_display(){
    let widget = basic_widget_ini();

    let time_str = current_time_str();

    let title = widget.addText('Updated at' + ' ' + time_str);
    title.textColor = Color.gray();
    title.font = Font.mediumSystemFont(14);

    let upde_msg = widget.addText('Updating...');
    upde_msg.textColor = Color.gray();
    upde_msg.font = Font.mediumSystemFont(20);

    show_widget(widget);
}

async function obtain_max_object_count() {
// Prepare request
    let url = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';
    let req = new Request(url);
    req.method = 'get';

// Load data
    let response;
    try {
        response = await req.loadJSON();
    } catch (e) {
        handle_api_error(e);
        return;
    }

    let max_obj_count = response['total'];
    return max_obj_count;
}

async function obtain_obj_info_worker(obj_id) {
// Prepare request
    let url = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/' + obj_id;
    let req = new Request(url);
    req.method = 'get';

// Load data
    let response;
    try {
        response = await req.loadJSON();
    } catch (e) {
        handle_api_error(e);
        return;
    }

    let obj_img = response['primaryImage'];
    let obj_title = response['title'];
    return {obj_img, obj_title};
}

async function obtain_obj_info(){
    let random_obj_id;
    let obj_img;
    let obj_title;

    do {
        let max_obj_count = await obtain_max_object_count();
        random_obj_id = generate_random_number(max_obj_count);

        const obj_info = await obtain_obj_info_worker(random_obj_id);
        obj_img = obj_info.obj_img;
        obj_title = obj_info.obj_title;

    } while (!obj_img || !obj_title); // Check if they're falsy: '', undefined, null

    console.log(random_obj_id);
    console.log(obj_img);

    return {obj_img, obj_title};
}

async function display_obj(obj_img, obj_title) {
    let widget = basic_widget_ini();

    let time_str = current_time_str();

    let title = widget.addText('Updated at' + ' ' + time_str);
    title.textColor = Color.gray();
    title.font = Font.mediumSystemFont(14);

    let obj_title_component = widget.addText(obj_title);
    obj_title_component.textColor = Color.gray();
    obj_title_component.font = Font.mediumSystemFont(20);

// Present the widget
    show_widget(widget);
}



// Main code
async function main(){
    waiting_widget_display();

    let obj_info = await obtain_obj_info();

    let widget = await display_obj(obj_info.obj_img, obj_info.obj_title);

    Script.complete();
}

main();
