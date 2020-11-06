// ==UserScript==
// @name         Aula Contact QR
// @namespace    https://github.com/hcsaustrup/tampermonkey
// @version      0.4
// @description  Add missing features to the Aula system
// @author       You
// @match        https://www.aula.dk/portal/*
// @grant        GM_addStyle
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/jquery.qrcode/1.0/jquery.qrcode.min.js
// ==/UserScript==

//*** @require      https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js

(function () {
    'use strict';

    var o = {}

    o.id = 0;

    o.encodeVcard = function (d) {
        var v = "BEGIN:VCARD\n" +
            "VERSION:4.0\n";

        if (d.name) {
            var nParts = d.name.split(" ", 2);
            v += "N:" + nParts[1] + ";" + nParts[0] + ";;;\n";
            v += "FN:" + d.name + "\n";
        }

        // v += "ORG:Foo Org\n";
        v += "TITLE:" + d.title + "\n";

        if (d.mobilePhone) {
            v += "TEL;TYPE=cell;VALUE=uri:tel:" + d.mobilePhone + "\n";
        }
        if (d.phone) {
            v += "TEL;TYPE=home,voice;VALUE=uri:tel:" + d.phone + "\n";
        }
        if (d.workPhone) {
            v += "TEL;TYPE=work,voice;VALUE=uri:tel:" + d.workPhone + "\n";
        }
        if (d.address) {
            v += "ADR;TYPE=HOME;LABEL=\"\":;;" + d.address + ";" + d.city + ";;" + d.zipcode + ";\n";
        }
        if (d.email) {
            v += "EMAIL:" + d.email + "\n";
        }

        v += "END:VCARD";
        return v;
    };

    o.qr = function (jInfo, jQR) {
        var d = {};
        jInfo.children(".mb-1").each(function (i, element) {
            d.role = element.innerText.trim();
        });
        jInfo.find(".contact-text span").each(function (i, element) {
            if (i == 0) {
                d.name = element.innerText.replace(/\(.*\)/, "").trim();
            }
            if (i == 1) {
                var m = element.innerText.match(/^(.*?), (\d{4}) (\w+.*)$/);
                if (m.length == 4) {
                    d.address = m[1].trim();
                    d.zipcode = m[2].trim();
                    d.city = m[3].trim();
                }
            }
        });
        jInfo.find(".contact-item").each(function (i, element) {
            var spans = $(element).children("span");
            if (spans.length != 2) return;
            var key = spans[0].innerText.toLowerCase().replace(/\W/g, ' ').trim().replace(' ', '-');
            var value = spans[1].innerText.trim().toLowerCase();

            if (key == "hjemme-tlf") {
                d.phone = value;
            } else if (key == "mobil-tlf") {
                d.mobilePhone = value;
            } else if (key == "arbejds-tlf") {
                d.workPhone = value;
            } else if (key == "email") {
                d.email = value;
            } else {
                console.log("Aula Tweaks: Unknown field: " + key);
            }
        });

        var jName = jInfo.closest(".contact").find(".contact-name");
        if (jName.length == 1) {
            var childNames = jName[0].innerText.replace(/\(.*\)/, '').trim().split(" ");
            if (childNames.length < 3) {
                d.childShortName = childNames[0];
            } else {
                childNames.pop();
                d.childShortName = childNames.join(" ");
            }
            d.title = d.childShortName + (d.childShortName.match(/s$/) ? "es" : "s") + " " + d.role.toLowerCase();
        }

        console.log("Data:", d);

        if (d.mobilePhone) {
            var vcard = o.encodeVcard(d);
            console.log("VCARD:", vcard);
            jQR.qrcode({ "text": vcard, width: 600, height: 600 });
        }
        jQR.show();
    };

    o.timeout = function () {
        $("div.relation").not(".qred").each(function (i, element) {
            console.log(element);
            var jElement = $(element);
            jElement.addClass('qred');
            var jQR = $("<div>")
            jQR.addClass("qr").hide();
            var jButton = $("<button>");
            jButton.text("QR");

            jButton.on('click', function () {
                o.qr(jElement, jQR);
                jButton.hide();
            });
            jQR.on('click', function () {
                jQR.hide();
                jButton.show();
            });

            jElement.prepend(jQR).prepend(jButton);
        });
        o.queueTimeout();
    };


    o.queueTimeout = function () {
        setTimeout(function () { o.timeout() }, 2000);
    };

    o.queueTimeout();


})();

