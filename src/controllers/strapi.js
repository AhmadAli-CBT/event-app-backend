let axios = require('axios');

exports.strapiData = async (req, res) => {
    try {
        let { language } = req.body;
        // All the API's of strapi for english language
        let sidebar = await getSidebarData(language);
        let home = await getHome(language);
        let eventTableScreen = await getEventTable(language);
        let hostDetailsTable = await getHost(language);
        let guestDetailsTable = await getGuest(language);
        let categories = await getCategory(language);
        let packages = await getPackage(language);
        let licenses = await getLicense(language);
        let singleEvent = await getSingleEventDetails(language);
        let eventGallery = await getGalleryDetails(language);
        let eventForm = await getEventForm(language);
        if (sidebar && home && eventTableScreen && hostDetailsTable && guestDetailsTable && categories && packages && licenses && singleEvent && eventGallery) {
            let resp = {
                sidebar,
                home,
                eventTableScreen,
                hostDetailsTable,
                guestDetailsTable,
                categories,
                packages,
                licenses,
                singleEvent,
                eventGallery,
                eventForm
            }
            res.send(resp)
        } else {
            res.send('1');
        }
    } catch (err) {
        res.status(200).json({
            status: false,
            error: err.message,
            message: "Error while creating task",
        });
    }
};
exports.strapiDataMobile = async (req, res) => {
    try {
        let language = req.params.language;
        // All the API's of strapi for english language
        let infoScreen = await getInfoScreen(language);
        let mobileGallery = await getMobileGallery(language);
        let generalMessages = await getGeneralMessages(language);
        let mobileTasks = await getMobileTasks(language);
        let mobileGreetings = await getGreetings(language);
        let eventProfile = await getEventProfile(language);
        let imageView = await getImageView(language);
        let widgetAlerts = await getWidgetAlerts(language);
        // console.log(mobileGallery)
        if (infoScreen) {
            let resp = {
                infoScreen,
                mobileGallery,
                generalMessages,
                mobileTasks,
                mobileGreetings,
                eventProfile,
                imageView,
                widgetAlerts
            }
            res.send(resp)
        } else {
            res.send('1');
        }
    } catch (err) {
        res.status(200).json({
            status: false,
            error: err.message,
            message: "Error while creating task",
        });
    }
};
exports.strapiDataMobilePromise = async (req, res) => {
    try {
        let language = req.params.language;
        let promisesArray = [getInfoScreen(language), getMobileGallery(language), getGeneralMessages(language), getMobileTasks(language), getGreetings(language),
        getEventProfile(language), getImageView(language), getWidgetAlerts(language)
        ]
        let respData = await Promise.all(promisesArray)
        let resp = {}
        for (let i = 0; i < respData.length; i++) {
            resp = {
                infoScreen: respData[0],
                mobileGallery: respData[1],
                generalMessages: respData[2],
                mobileTasks: respData[3],
                mobileGreetings: respData[4],
                eventProfile: respData[5],
                imageView: respData[6],
                widgetAlerts: respData[7]
            }
        }
        res.send(resp)
    } catch (err) {
        console.log(err)
        res.status(200).json({
            status: false,
            error: err.message,
            message: "Error while creating task",
        });
    }
};

// Web

let getSidebarData = async (language) => {
    if (language == 'en') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/web-sidebars');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-web-sidebars');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getHome = async (language) => {
    if (language == 'en') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/web-homes');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-web-homes');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getEventTable = async (language) => {
    if (language == 'en') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/web-events');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-web-events');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getHost = async (language) => {
    if (language == 'en') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/web-hosts');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-web-hosts');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getGuest = async (language) => {
    if (language == 'en') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/web-guests');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-web-guests');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getCategory = async (language) => {
    if (language == 'en') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/web-catgories');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-web-categories');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getPackage = async (language) => {
    if (language == 'en') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/web-packages');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-web-packages');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getLicense = async (language) => {
    if (language == 'en') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/web-licenses');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-web-licenses');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getSingleEventDetails = async (language) => {
    if (language == 'en') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/web-single-events');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-web-single-events');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getGalleryDetails = async (language) => {
    if (language == 'en') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/web-galleries');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-event-galleries');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getEventForm = async (language) => {
    if (language == 'en') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/web-event-forms');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-event-forms');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}

// Mobile

let getWidgetAlerts = async (language) => {
    if (language == 'eng') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/widget-alerts');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-widget-alerts');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getImageView = async (language) => {
    if (language == 'eng') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/view-img-screens');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-image-views');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getEventProfile = async (language) => {
    if (language == 'eng') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/mobile-event-profiles');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-event-profiles');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getGreetings = async (language) => {
    if (language == 'eng') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/mobile-greetings');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-mobile-greetings');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getMobileTasks = async (language) => {
    if (language == 'eng') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/mobile-tasks');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-mobile-tasks');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getMobileGallery = async (language) => {
    if (language == 'eng') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/mobile-galleries');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-mobile-galleries');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getGeneralMessages = async (language) => {
    if (language == 'eng') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/general-messages');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-general-messages');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}
let getInfoScreen = async (language) => {
    if (language == 'eng') {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/info-screens');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    } else {
        let { data } = await axios.get('https://eventstrapi.thecbt.cyou/api/gr-info-screens');
        if (data && data.data && data.data.length > 0) {
            return data.data[0].attributes
        } else {
            null
        }
    }
}