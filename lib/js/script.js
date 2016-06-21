/** Credits - Do not edit/remove this comment (Read http://domain.name/LICENSE)
 * @desc domain.name core source file
 * @author Dexon <dexon@live.ca> (https://github.com/Dexon95)
 * @contributors 
 */

 var app = {
    id: 1269
 }

 var user = {
    connected: false,
    token: null,
    uname: null,
    balance: null,
    clientSeed: null,
    hash: null
 }

var showingrecaptcha = false;

function onloadCallback() {
    grecaptcha.render('faucetClaimCaptcha', {
        'sitekey' : '6LfXmQwTAAAAANaHFH1Zv6EhYX3lZg3Rl5sOkruQ',
        'callback' : correctCaptcha
    });
};

$(function(){
    if(getURLParameter('access_token')!="" && getURLParameter('access_token')!=null){
        login(getURLParameter('access_token'));
    }

    $("#faucetButton").click(function(){
        if(showingrecaptcha == false){
            $("#faucetClaimCaptcha").css("top", "10px");
            showingrecaptcha = true;
            console.log("showing google recaptcha");
        }else if(showingrecaptcha == true){
            $("#faucetClaimCaptcha").css("top", "-90px");
            showingrecaptcha = false;
            console.log("hiding google recaptcha");
        }
    });

    $('#depositButton').click(function(){
        var windowUrl = 'https://www.moneypot.com/dialog/deposit?app_id='+app.id;
        var windowName = 'manage-auth';
        var windowOpts = 'width=420,height=350,left=100,top=100';
        var windowRef = window.open(windowUrl, windowName, windowOpts);
        windowRef.focus();
    });

    $('#withdrawButton').click(function(){
        var windowUrl = 'https://www.moneypot.com/dialog/withdraw?app_id='+app.id;
        var windowName = 'manage-auth';
        var windowOpts = 'width=420,height=350,left=100,top=100';
        var windowRef = window.open(windowUrl, windowName, windowOpts);
        windowRef.focus();
    });

    window.addEventListener('message', function(event) {
        if (event.origin === 'https://www.moneypot.com' && event.data === 'UPDATE_BALANCE') {
            $.getJSON("https://api.moneypot.com/v1/auth?access_token="+user.token, function(json){
                user.balance = json.user.balance/100;
                $('#balance-result').text((user.balance).formatMoney(2,'.',','));  
            });
        }
    }, false);

    $(".skin-one").click(function(){
        $('.change-skin').removeClass("skin-active");
        $(this).addClass("skin-active");

        $('.skincss').removeClass("wheel-active");
        $('.wheel-one').addClass("wheel-active");
    });
    $(".skin-two").click(function(){
        $('.change-skin').removeClass("skin-active");
        $(this).addClass("skin-active");

        $('.skincss').removeClass("wheel-active");
        $('.wheel-two').addClass("wheel-active");
    });
    $(".skin-three").click(function(){
        $('.change-skin').removeClass("skin-active");
        $(this).addClass("skin-active");

        $('.skincss').removeClass("wheel-active");
        $('.wheel-three').addClass("wheel-active");
    });
    $(".skin-four").click(function(){
        $('.change-skin').removeClass("skin-active");
        $(this).addClass("skin-active");

        $('.skincss').removeClass("wheel-active");
        $('.wheel-four').addClass("wheel-active");
    });
});

function login(token){
    window.history.pushState('', 'luckyspin', '/luckyspin');

    var loaderContainer = jQuery('<div/>', {
        id:     'loaderContainer',
        style:  "position: absolute;"+
                "top: 0; right: 0; bottom: 0; left: 0;"+
                "z-index: 2000;"
    }).appendTo('body');
    
    var loaderSegment = jQuery('<div/>', {
        class:  'ui segment',
        style:  'height: 100%; opacity: 0.7;'
    }).appendTo(loaderContainer);
    
    var loaderDimmer = jQuery('<div/>', {
        class:  'ui active dimmer'
    }).appendTo(loaderSegment);
    
    var loaderText = jQuery('<div/>', {
        id:     'loaderText',
        class:  'ui text loader',
        text:   'Connecting'
    }).appendTo(loaderDimmer);

    $.getJSON("https://api.moneypot.com/v1/token?access_token="+token, function(json){
        if(json.error){
            console.error("LOGIN ERROR:", json.error);
            $('#loaderText').text('Error while connecting: '+ json.error);
            return;
        }

        user.uname = json.auth.user.uname;
        user.balance = json.auth.user.balance/100;
        user.connected = true;
        user.token = token;
        user.clientSeed = getRandCseed();

        $('#login_button').text(user.uname);
        $('#balance-result').text((user.balance).formatMoney(2,'.',','));
        $('#bet_cashout_button').text("Bet");

        $('#loaderContainer').css('display', 'none');

        $('#wager-result').attr("disabled", false);
    });
}

function getHash(callback){
    if(user.hash == null){
        $.post("https://api.moneypot.com/v1/hashes?access_token="+user.token, '', function(json) {
            if(json.hash){
                console.log("[Provably fair] We received our hash: "+json.hash);
                user.hash = (typeof json.hash === "undefined"?null:json.hash);
                if(callback) callback();
            }else{
                console.error("HASH ERROR:",json);
                return;
            }
        });
    }else{
        if(callback) callback();
    }
}

$('#spin-circle').click(function(){
    if(!user.connected){
        window.location.href = "https://www.moneypot.com/oauth/authorize?app_id=1269&response_type=token&state=Meh&redirect_uri=https://dexon95.github.io/bustasatoshi/";
        return;
    }
    
    placeBet(currentWheel);
});

var currentWheel = 0;
var spinning = false;
function placeBet(wheelNumber){
    if(spinning) return;

    $('#wager-result').attr("disabled", true);

    getHash(function(){
        
        var wheels = [[
            0,
            0.5,
            0.25,
            2,
            1,
            0.5,
            2,
            3,
            0,
            0.5,
            1,
            0.5,
            1,
            2,
            1,
            0.5,
            1,
            3,
            0.5,
            0,
            2,
            0.5,
            1,
            0.25
        ],
        [
            2,
            0,
            1.25,
            0,
            2,
            0,
            2,
            0,
            2,
            0,
            2,
            0,
            2,
            0,
            1.75,
            0,
            2,
            0,
            2,
            0,
            2,
            0,
            2,
            0
        ],
        [
            2.5,
            2.75,
            2.5,
            0,
            0,
            0,
            0,
            0,
            2.5,
            2.75,
            2.5,
            0,
            0,
            1,
            0,
            0,
            2.5,
            2.75,
            2.25,
            0,
            0,
            0,
            0,
            0
        ]];

        var payouts = [];

        for(var i=0; i<wheels[wheelNumber].length; i++){
            payouts.push({
                from: (Math.pow(2,32)/wheels[wheelNumber].length)*i,
                to: (Math.pow(2,32)/wheels[wheelNumber].length)*(i+1),
                value: (wheels[wheelNumber][i]*(parseFloat($('#wager-result').val())))*100
            });
        }

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: "https://api.moneypot.com/v1/bets/custom?access_token="+user.token,
            data: JSON.stringify({
                client_seed: parseInt(user.clientSeed),
                hash: String(user.hash),
                wager: (parseFloat($('#wager-result').val())*100),
                payouts: payouts
            }),
            dataType: "json",
            error: function(xhr, status, error) {
                console.error("BET ERROR:", xhr.responseText);
                return;
            }
        }).done(function(data){
            var outcome = data.outcome;
            var prizeNumber = 0;
            for(var i=0; i<wheels[wheelNumber].length; i++){
                if(outcome<(Math.pow(2,32)/wheels[wheelNumber].length)*(i+1)){
                    prizeNumber = i;
                    break;
                }
            }
            SPIN(prizeNumber);
        });
    });
}

function SPIN(number){
    var $r = $('.wheel-active img').fortune(wheels[wheelNumber].length);
    $r.spin(number).done(function(price) {
        $.getJSON("https://api.moneypot.com/v1/auth?access_token="+user.token, function(json){
            user.balance = json.user.balance/100;
            $('#balance-result').text((user.balance).formatMoney(2,'.',','));  
        });

        $('#wager-result').attr("disabled", false);
    });
}

function correctCaptcha(response) {
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "https://api.moneypot.com/v1/claim-faucet?access_token="+user.token,
        data: JSON.stringify({
            "response": response
        }),
        dataType: "json"
    }).done(function(data) {
        console.log((data.amount/100)+" has been added to your balance!");
        $.get( "https://api.moneypot.com/v1/auth?access_token="+user.token, function( data ) {
            if(typeof data.user.uname !== "undefined"){
                user_balance = (data.user.balance/100);
                $('#balance-result').text((user.balance).formatMoney(2,'.',','));
            }
        });
        $("#faucetClaimCaptcha").css("top", "-90px");
        grecaptcha.reset();
        showingrecaptcha = false;
    }).fail(function(data) {
        var error = data.error;
        if(error == "FAUCET_ALREADY_CLAIMED"){
            console.error("Faucet already claimed");
            grecaptcha.reset();
        }else if(error == "INVALID_INPUT_RESPONSE"){
            console.error("Google has rejected the response. Try to refresh and do again.");
            grecaptcha.reset();
        }
        $("#faucetClaimCaptcha").css("top", "-90px");
        showingrecaptcha = false;
    });
};

function getRandCseed(){
    var array = new Uint32Array(1);
    return window.crypto.getRandomValues(array)[0];
}

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[#|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.hash)||[,""])[1].replace(/\+/g, '%20'))||null
}

Number.prototype.formatMoney = function(c, d, t){
    var n = this, 
        c = isNaN(c = Math.abs(c)) ? 2 : c, 
        d = d == undefined ? "." : d, 
        t = t == undefined ? "," : t, 
        s = n < 0 ? "-" : "", 
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};