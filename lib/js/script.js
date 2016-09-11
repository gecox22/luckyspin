/** Credits - Do not edit/remove this comment (Read http://luckyspin.pw/LICENSE)
 * @desc luckyspin.pw core source file
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

var socket;
var showingrecaptcha = false;
var onlineUsers = 0;
var startingbet = 1;
function onloadCallback() {
    grecaptcha.render('faucetClaimCaptcha', {
        'sitekey' : '6LflUyITAAAAAAWIIawxt_yYJzj_SyD-Mm5JYtld',
        'callback' : correctCaptcha
    });
};
var enabledautobet = 0;
var startafterlosses = 0;
var stopafterbet = 0;
var max_bet = 0;
$(function(){
    if(getURLParameter('access_token')!="" && getURLParameter('access_token')!=null){
        login(getURLParameter('access_token'));
    }

    // https://www.moneypot.com/introducing-socketpot/
    socket = io('https://socket.moneypot.com');

    socket.on('connect', function() {
        console.info('[socketpot] connected');
        addNewChatMessage({text:"Connected to socketpot."});
        var authRequest = {
            app_id: app.id,
            access_token: (user.token!=null?user.token:undefined),
            subscriptions: ['CHAT', 'DEPOSITS', 'BETS']
        };
        socket.emit('auth', authRequest, function(err, authResponse) {
            if (err) {
                console.error('[auth] Error:', err);
                console.info('[authRequest]:', authRequest);
                console.info('[authResponse]:', authResponse);
                return;
            }  
            console.info('[authResponse]:', authResponse);

            var authData = authResponse;
            for(var i=0; i<authData.chat.messages.length; i++){
                addNewChatMessage(authData.chat.messages[i]);
            }
            onlineUsers = ObjectLength(authData.chat.userlist);
            $('#chatOnlineUsersCount').text(onlineUsers);

            $('#chat_input').prop("disabled", false);
            $('#chat_input').attr("placeholder","Chat here...");
        });
    });

    socket.on('disconnect', function() {
        console.warn('[socketpot] disconnected');
        addNewChatMessage({text:"Lost connection to socketpot."});
        $('#chat_input').prop("disabled", true);
        $('#chat_input').attr("placeholder","Not connected");
    });
    socket.on('client_error', function(err) {
        console.error('[socketpot] client_error:', err);
    });
    socket.on('error', function(err) {
        console.error('[socketpot] error:', err);
        addNewChatMessage({text:"Error: "+err});
    });
    socket.on('reconnect_error', function(err) {
        console.error('[socketpot] error while reconnecting:', err);
        console.info('If this message keeps coming back, try to clear cache then close and reopen your browser.');
        addNewChatMessage({text:"Could not reconnect to socketpot."});
        $('#chat_input').prop("disabled", true);
        $('#chat_input').attr("placeholder","Not connected");
    });
    socket.on('reconnecting', function() {
        console.warn('[socketpot] attempting to reconnect...');
        addNewChatMessage({text:"Trying to reconnect to socketpot."});
        $('#chat_input').prop("disabled", true);
        $('#chat_input').attr("placeholder","Not connected");
    });
    socket.on('reconnect', function() {
        console.info('[socketpot] successfully reconnected');
        addNewChatMessage({text:"Successfully reconnected to socketpot."});
        $('#chat_input').prop("disabled", false);
        $('#chat_input').attr("placeholder","Chat here...");
    });
    socket.on('new_bet', function(payload) {
        setTimeout(function(){
            console.info("[new_bet] Detected a new bet has been done.", payload);
            if(user.uname == payload.uname){
                var table = document.getElementById("mybet_history");
                
                var row = table.insertRow(0);
                row.id = "mybet_"+payload.id;
                row.className = "mybets_log_item";
                
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);
                var cell4 = row.insertCell(3);
                var cell5 = row.insertCell(4);
                
                var win = parseFloat(payload.profit) >= 0;
                
                cell1.innerHTML = "<a href=\"https://www.moneypot.com/bets/"+payload.id+"\" target=\"_blank\">"+payload.id+"</a>";
                cell1.className = (win?"win":"lose");

                cell2.innerHTML = payload.uname;

                cell3.innerHTML = parseFloat(((parseFloat(payload.wager)+parseFloat(payload.profit))/parseFloat(payload.wager)).formatMoney(2, '.', ''))+"x";
                cell3.className = (parseFloat(payload.profit)>1?"table-result up":(parseFloat(payload.profit)<1?(parseFloat(payload.profit)==0?"table-result equal":"table-result down"):"table-result equal"));

                cell4.innerHTML = parseFloat(payload.wager/100).toFixed(2);

                cell5.innerHTML = parseFloat((payload.profit>=0?(payload.profit+payload.wager):payload.profit)/100).toFixed(2);

                $('.mybets_log_item').each(function(index){
                    if(index>25) $(this).remove();
                });
            }

            var table = document.getElementById("bet_history");
                
            var row = table.insertRow(0);
            row.id = "bet_"+payload.id;
            row.className = "allbets_log_item";
            
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);
            var cell5 = row.insertCell(4);
            
            var win = parseFloat(payload.profit) >= 0;
            
            cell1.innerHTML = "<a href=\"https://www.moneypot.com/bets/"+payload.id+"\" target=\"_blank\">"+payload.id+"</a>";
            cell1.className = (win?"win":"lose");

            cell2.innerHTML = payload.uname;

            cell3.innerHTML = parseFloat(((parseFloat(payload.wager)+parseFloat(payload.profit))/parseFloat(payload.wager)).formatMoney(2, '.', ''))+"x";
            cell3.className = (parseFloat(payload.profit)>0?"table-result up":(parseFloat(payload.profit)<0?"table-result down":"table-result equal"));

            cell4.innerHTML = parseFloat(payload.wager/100).toFixed(2);

            cell5.innerHTML = parseFloat((payload.profit>=0?(payload.profit+payload.wager):payload.profit)/100).toFixed(2);

            $('.allbets_log_item').each(function(index){
                if(index>25) $(this).remove();
            });
        }, 1500);
    });
    socket.on('user_joined', function(data) {
        onlineUsers++;
        $('#chatOnlineUsersCount').text(onlineUsers);
    });
    socket.on('user_left', function(data) {
        onlineUsers--;
        $('#chatOnlineUsersCount').text(onlineUsers);
    });
    socket.on('new_message', function(data) {
        console.log("[new_message] ",data);
        addNewChatMessage(data);
    });

    $("#chatButton").click(function(){
        $("#chatButton").addClass("selected");
        $("#allBetsButton").removeClass("selected");
		$("#autoBetButton").removeClass("selected");
        $("#myBetsButton").removeClass("selected");
        $(".chat").css("display", "table");
        $(".table-spins").css("display", "none");
        $(".my-table-spins").css("display", "none");
		$(".autobet").css("display", "none");
    });

    $("#myBetsButton").click(function(){
        $("#myBetsButton").addClass("selected");
        $("#allBetsButton").removeClass("selected");
		$("#autoBetButton").removeClass("selected");
        $("#chatButton").removeClass("selected");
        $(".my-table-spins").css("display", "table");
        $(".table-spins").css("display", "none");
        $(".chat").css("display", "none");
		$(".autobet").css("display", "none");
    });

    $("#allBetsButton").click(function(){
        $("#allBetsButton").addClass("selected");
		$("#autoBetButton").removeClass("selected");
        $("#myBetsButton").removeClass("selected");
        $("#chatButton").removeClass("selected");
        $(".my-table-spins").css("display", "none");
        $(".table-spins").css("display", "table");
        $(".chat").css("display", "none");
		$(".autobet").css("display", "none");
    });
	
    $("#autoBetButton").click(function(){
        $("#autoBetButton").addClass("selected");
        $("#allBetsButton").removeClass("selected");
        $("#myBetsButton").removeClass("selected");
        $("#chatButton").removeClass("selected");
        $(".my-table-spins").css("display", "none");
        $(".table-spins").css("display", "none");
        $(".chat").css("display", "none");
        $(".autobet").css("display", "table");
    });
    $("#startautobet").click(function(){
if (enabledautobet == 1) {
document.getElementById("startautobet").childNodes[0].nodeValue="Start";
clearInterval(IntervalAutobet);
enabledautobet = 0;
} else {
if (Fixmultiplier == 0 && Fixmultiplier2 == 0){
totalbetsdone = 0;
startingbet = parseFloat($('#wager-result').val());
autobet();
IntervalAutobet = setInterval(function(){ autobet() }, 3000);
document.getElementById("startautobet").childNodes[0].nodeValue="Stop";
enabledautobet = 1;
stopafterbet = parseFloat($('#total_bets').val());
startafterlosses = parseFloat($('#start_after_bets').val());
max_bet = parseFloat($('#max_bet').val());

} else {
window.alert('Error: Multiply on win and/or loss are not numbers!');
}
}
    });

    $("#faucetButton").click(function(){
        if(!user.connected){
            $.notify({
                icon: 'glyphicon glyphicon-warning-sign',
                title: '<b>Warning</b>:',
                message: 'You need to be connected to claim the faucet!' 
            },{
                type: 'warning',
                allow_dismiss: true,
                placement: {
                    from: "top",
                    align: "right"
                },
                showProgressbar: false,
                newest_on_top: true,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutDown'
                }
            });
            return;
        }
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

    $(".login_button").click(function(){
        if(user.connected){
            location.reload();
        }else{
            window.location.href = "https://www.moneypot.com/oauth/authorize?app_id=1269&response_type=token&state=Meh&redirect_uri=http://luckyspin.pw";
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
                if(Math.floor(json.user.balance) - user.balance != 0){
                    if(Math.floor(json.user.balance) - user.balance > 0){
                        $.notify({
                            icon: 'glyphicon glyphicon-warning-sign',
                            title: '<b>Balance update</b>:',
                            message: 'Deposited <b>'+parseFloat((Math.floor(json.user.balance) - user.balance)/100).formatMoney(2,'.',',')+'</b> bits!' 
                        },{
                            type: 'success',
                            allow_dismiss: true,
                            placement: {
                                from: "top",
                                align: "right"
                            },
                            showProgressbar: false,
                            newest_on_top: true,
                            animate: {
                                enter: 'animated fadeInDown',
                                exit: 'animated fadeOutDown'
                            }
                        });
                    }else{
                        $.notify({
                            icon: 'glyphicon glyphicon-warning-sign',
                            title: '<b>Balance update</b>:',
                            message: 'Withdrawn <b>'+parseFloat((user.balance) - (Math.floor(json.user.balance))).formatMoney(2,'.',',')+'</b> bits!'
                        },{
                            type: 'warning',
                            allow_dismiss: true,
                            placement: {
                                from: "top",
                                align: "right"
                            },
                            showProgressbar: false,
                            newest_on_top: true,
                            animate: {
                                enter: 'animated fadeInDown',
                                exit: 'animated fadeOutDown'
                            }
                        });
                    }
                }
                user.balance = Math.floor(json.user.balance)/100;
                $('.balance-result').text((user.balance).formatMoney(2,'.',','));  
            });
        }
    }, false);

    $(".skin-one").click(function(){
        currentWheel = 0; // 1
        $('.change-skin').removeClass("skin-active");
        $(this).addClass("skin-active");

        $('.skinwheels').removeClass("wheel-active");
        $('.wheel-one').addClass("wheel-active");
    });
    $(".skin-two").click(function(){
        currentWheel = 1; // 2
        $('.change-skin').removeClass("skin-active");
        $(this).addClass("skin-active");

        $('.skinwheels').removeClass("wheel-active");
        $('.wheel-two').addClass("wheel-active");
    });
    $(".skin-three").click(function(){
        currentWheel = 2; // 3
        $('.change-skin').removeClass("skin-active");
        $(this).addClass("skin-active");

        $('.skinwheels').removeClass("wheel-active");
        $('.wheel-three').addClass("wheel-active");
    });
    $(".skin-four").click(function(){
        currentWheel = 3; // 4
        $('.change-skin').removeClass("skin-active");
        $(this).addClass("skin-active");

        $('.skinwheels').removeClass("wheel-active");
        $('.wheel-four').addClass("wheel-active");
    });

    $('#50p').click(function(){
        $('#wager-result').val(parseFloat((parseFloat($('#wager-result').val()) * 0.5).toFixed(2)));
    });
    $('#2x').click(function(){
        $('#wager-result').val(parseFloat((parseFloat($('#wager-result').val()) * 2).toFixed(2)));
    });
    $('#min').click(function(){
        $('#wager-result').val(parseFloat(((parseFloat(user.balance)>=1?1:0)).toFixed(2)));
		startingbet = $('#wager-result').val();
    });
    $('#max').click(function(){
        $('#wager-result').val(parseFloat(parseFloat(user.balance).toFixed(2)));
		startingbet = $('#wager-result').val();
    });
});

function login(token){
    window.history.pushState('', 'luckyspin', '/');

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
        user.balance = Math.floor(json.auth.user.balance)/100;
        user.connected = true;
        user.token = token;
        user.clientSeed = getRandCseed();

        $('.login_button').text(user.uname);
        $('.balance-result').text((user.balance).formatMoney(2,'.',','));
        $('.bet_cashout_button').text("Bet");

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
                $('#wager-result').attr("disabled", false);
                $('.spin-circle').css("display", "inline-block");
                return;
            }
        });
    }else{
        if(callback) callback();
    }
}

$('.spin-circle').click(function(){
    if(!user.connected){
        window.location.href = "https://www.moneypot.com/oauth/authorize?app_id=1269&response_type=token&state=Meh&redirect_uri=http://luckyspin.pw";
        return;
    }
    
    placeBet(currentWheel);
});

var currentWheel = 0;
var spinning = false;


var wheels = [[
    {value:0},
    {value:0.5},
    {value:0.25},
    {value:2},
    {value:1},
    {value:0.5},
    {value:2},
    {value:3},
    {value:0.25},
    {value:0.5},
    {value:1},
    {value:0.5},
    {value:1},
    {value:0.5},
    {value:2},
    {value:0.5},
    {value:1},
    {value:3},
    {value:0.5},
    {value:0},
    {value:2},
    {value:0.5},
    {value:1},
    {value:0.25}
],
[
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:1.75},
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:1.25},
    {value:0},
    {value:2}
],
[
    {value:2.5},
    {value:2.75},
    {value:2.5},
    {value:0},
    {value:0},
    {value:0},
    {value:0},
    {value:0},
    {value:2.5},
    {value:2.75},
    {value:2.5},
    {value:0},
    {value:0},
    {value:.75},
    {value:0},
    {value:0},
    {value:2.5},
    {value:2.75},
    {value:2.25},
    {value:0},
    {value:0},
    {value:0},
    {value:0},
    {value:0}
],
[
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:3},
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:10},
    {value:0},
    {value:1}
]];

var multiplyonwin = 0;
var multiplyonloss = 0;
var totallosses = 0;
function placeBet(wheelNumber){
    if(spinning) return;

    $('#wager-result').attr("disabled", true);
    $('.spin-circle').css("display", "none");

    getHash(function(){
        var payouts = [];

        for(var i=0; i<wheels[wheelNumber].length; i++){
            payouts.push({
                from: Math.floor((Math.pow(2,32)/wheels[wheelNumber].length)*i),
                to: Math.floor((Math.pow(2,32)/wheels[wheelNumber].length)*(i+1)),
                value: (wheels[wheelNumber][i].value*(parseFloat($('#wager-result').val())))*100
            });
        }
        console.log("DEBUGGING:", payouts);

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
                $('#wager-result').attr("disabled", false);
                $('.spin-circle').css("display", "inline-block");
                return;
            }
        }).done(function(data){
            console.log("[DATA - result from bet]",data);
            var outcome = data.outcome;
            var prizeNumber = 0;
            for(var i=0; i<payouts.length; i++){
                if(outcome>=payouts[i].from && outcome<payouts[i].to){
                    prizeNumber = i;
                    SPIN(prizeNumber);
                    break;
                }
            }
			if (enabledautobet == 1){
			multiplycheck(data);
			} else {
			console.log(enabledautobet);
			}
            user.hash = data.next_hash;
        });
    });
}

function SPIN(number){
    var $r = $('.wheel-active img').fortune({prices: wheels[currentWheel], clockWise: true});
    console.log("[DEBUG] NUMBER TO SPIN:", number,"| Amount:", wheels[currentWheel].length);
    number = parseFloat((wheels[currentWheel].length - parseInt(number)) + 5.5);
    console.log("DEBUG: number:", number);
    $r.spin(number).done(function(price) {
        console.log("DEBUG: prize:", price);
        $.getJSON("https://api.moneypot.com/v1/auth?access_token="+user.token, function(json){
            user.balance = Math.floor(json.user.balance)/100;
            $('.balance-result').text((user.balance).formatMoney(2,'.',','));  
        });

        $('#wager-result').attr("disabled", false);
        $('.spin-circle').css("display", "inline-block");
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
        user.balance += 2;
        $('.balance-result').text((user.balance).formatMoney(2,'.',','));
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
        grecaptcha.reset();
    });
};

function getRandCseed(){
    var array = new Uint32Array(1);
    return window.crypto.getRandomValues(array)[0];
}

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[#|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.hash)||[,""])[1].replace(/\+/g, '%20'))||null
}

$("#chat_input").keyup(function(event){
    onkeyup_check(event);
});
function autobet(){
if (Fixmultiplier2 == 0 && Fixmultiplier == 0){
totalbetsdone = totalbetsdone+1;
placeBet(currentWheel);
if (totalbetsdone >= stopafterbet && stopafterbet > 0){
document.getElementById("startautobet").click();
}
}
}
function multiplycheck(data){
if (totallosses < startafterlosses && startafterlosses > 0) {
			if (data.profit < 0 && multiplyonloss > 0){
			totallosses = totallosses+1;
			} else if (multiplyonloss == 0 && data.profit < 0) {
			totallosses = totallosses+1;
			}else if (data.profit > 0 && multiplyonwin > 0) {
			totallosses = 0;
			} else if (multiplyonwin == 0 && data.profit > 0) {
			totallosses = 0;
			}			
			} else {
			if (data.profit < 0 && multiplyonloss > 0){
			$('#wager-result').val(parseFloat((parseFloat($('#wager-result').val()) * multiplyonloss/100).toFixed(2)));
			if(parseFloat($('#wager-result').val()) > max_bet && max_bet > 0){
			$('#wager-result').val(parseFloat((parseFloat(startingbet).toFixed(2))));
			document.getElementById("startautobet").click();
			}
			totallosses = totallosses+1;
			} else if (multiplyonloss == 0 && data.profit < 0) {
			$('#wager-result').val(parseFloat((parseFloat(startingbet).toFixed(2))));
			totallosses = totallosses+1;
			if(parseFloat($('#wager-result').val()) > max_bet && max_bet > 0){
			$('#wager-result').val(parseFloat((parseFloat(startingbet).toFixed(2))));
			document.getElementById("startautobet").click();
			}
			}else if (data.profit > 0 && multiplyonwin > 0) {
			$('#wager-result').val(parseFloat((parseFloat($('#wager-result').val()) * multiplyonwin/100).toFixed(2)));
			totallosses = 0;
			} else if (multiplyonwin == 0 && data.profit > 0) {
			$('#wager-result').val(parseFloat((parseFloat(startingbet).toFixed(2))));
			totallosses = 0;
			} else {
			}
			}
}

function onkeyup_check(e){
    if (e.keyCode == 13){
        console.log("Enter pressed on chat, sending message...");
        sendMessage($("#chat_input").val());
    }
}
var Fixmultiplier = 1;
var Fixmultiplier2 = 1;

$("#autobet_input_loss").keyup(function(event){
    onkeyup_check_autobet_loss();
});

$("#autobet_input_win").keyup(function(event){
    onkeyup_check_autobet_win();
});
function onkeyup_check_autobet_loss(){
    if (isNaN(autobet_input_loss.value)){

        // console.log("Multiply on win is not a number ");
		Fixmultiplier2 = 1;
    } else {
	multiplyonloss = parseInt(autobet_input_loss.value);
	Fixmultiplier2 = 0;
	}
}
function onkeyup_check_autobet_win(){
    if (isNaN(autobet_input_win.value)){
        //console.log("Multiply on loss is not a number ");

		Fixmultiplier = 1;
    } else {
	multiplyonwin = parseInt(autobet_input_win.value);
	Fixmultiplier = 0;
	}
}
function sendMessage(data){
    if(!user.connected){
        $.notify({
            icon: 'glyphicon glyphicon-warning-sign',
            title: '<b>Warning</b>:',
            message: 'You need to be connected to use the chat!' 
        },{
            type: 'warning',
            allow_dismiss: true,
            placement: {
                from: "top",
                align: "right"
            },
            showProgressbar: false,
            newest_on_top: true,
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutDown'
            }
        });
        return;
    }
    
    console.log("Chat input cleared, sending the socket...");

    if(data.split(" ")[0] == "/tip" || data.split(" ")[0] == "!tip"){
        var params = data.split(" ");

        if(params.length < 3){
            $.notify({
                icon: 'glyphicon glyphicon-warning-sign',
                title: '<b>Error</b>:',
                message: 'Wrong syntax used for the command. \'/tip username amount\'' 
            },{
                type: 'danger',
                allow_dismiss: true,
                placement: {
                    from: "top",
                    align: "right"
                },
                showProgressbar: false,
                newest_on_top: true,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutDown'
                }
            });
        }

        var tipUsername = params[1];
        var tipAmount = params[2];

        var confirmAlert = confirm("Are you sure to tip "+tipAmount+" Bits to "+tipUsername+" ?");
        if(confirmAlert == true && tipAmount == parseFloat(tipAmount)){
            $.ajax({
                type: "POST",
                contentType: "application/json",
                url: "https://api.moneypot.com/v1/tip?access_token="+user.token,
                data: JSON.stringify({
                    "uname": tipUsername,
                    "amount": Math.floor(tipAmount*100)
                }),
                dataType: "json",
                error: function(xhr, status, error) {
                    console.error("[TIP ERROR]", xhr.responseText);
                    $.notify({
                        icon: 'glyphicon glyphicon-warning-sign',
                        title: '<b>Error</b>:',
                        message: "Failed to send tip to "+tipUsername+": "+xhr.responseText.error
                    },{
                        type: 'danger',
                        allow_dismiss: true,
                        placement: {
                            from: "top",
                            align: "right"
                        },
                        showProgressbar: false,
                        newest_on_top: true,
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutDown'
                        }
                    });
                    addNewChatMessage({
                        created_at: (new Date()).toISOString(),
                        text: "Error when sending tip to "+tipUsername+": "+xhr.responseText.error
                    });
                }
             }).done(function(data){
                if(data.id){
                    addNewChatMessage({
                        created_at: (new Date()).toISOString(),
                        text: "Sent "+tipAmount+" Bits to "+tipUsername
                    });

                    user.balance = (user.balance-tipAmount);
                    $('.balance-result').text((user.balance).formatMoney(2,'.',','));
                }else{
                    addNewChatMessage({
                        created_at: (new Date()).toISOString(),
                        text: "Error when sending tip to "+tipUsername+": "+data
                    });
                }
            });
        }else{
            $.notify({
                icon: 'glyphicon glyphicon-warning-sign',
                title: '<b>Error</b>:',
                message: 'Wrong syntax used for the command. \'/tip username amount\'' 
            },{
                type: 'danger',
                allow_dismiss: true,
                placement: {
                    from: "top",
                    align: "right"
                },
                showProgressbar: false,
                newest_on_top: true,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutDown'
                }
            });
        }
        $("#chat_input").val("");
        return;
    }


    var socket_timeout = setTimeout(function(){
        addNewChatMessage({text:"Could not send your message. Please, try to reconnect or contact moneypot support."});
        addNewChatMessage({text:"Could not send your message. Please, try to reconnect or contact moneypot support."});
    }, 3000); // 3 seconds

    $("#chat_input").val("");
    if(!socket){
        console.error("Error, 'socket' is gone nuts.");
        return;
    }
    socket.emit('new_message', {
        text: data
    }, function(err, msg){
        clearTimeout(socket_timeout);
        if (err) {
            console.log('Error when submitting new_message to server:', err);
            return;
        }
        console.log('Successfully submitted message:', msg);
    });
}

function addNewChatMessage(data){
    var date = {};
    if(typeof data.user !== "undefined" && typeof data.channel !== "undefined"){
        var username = escapeHTML(data.user.uname);
        var rank = data.user.role;
        date = {
            hours: addZero((new Date(data.created_at)).getHours()),
            mins: addZero((new Date(data.created_at)).getMinutes())
        }
    }else{
        var username = "Server";
        var rank = "SERVER";
        date = {
            hours: addZero((new Date()).getHours()),
            mins: addZero((new Date()).getMinutes())
        }
    }
    if(username == "luckybot") rank = "SERVER";
    
    var message = escapeHTML(data.text);
    message = stripCombiningMarks(message);

    var notify = false;
    if($('#username').text() != "" && message.indexOf('@'+$('#username').text())>-1){
        if(username!=$('#username').text()) notify = true;
        message = message.replace('@'+$('#username').text(), "<span class='notify'>@"+$('#username').text()+"</span>");
    }
    
    var chatMonitor = document.getElementById("chat_monitor");
    chatMonitor.innerHTML = "<div class=\"chat_message "+rank+"\"><span class=\"time\">"+date.hours+":"+date.mins+"</span> <span class=\"username\">"+username+":</span> <span class=\"message\">"+urlify(message)+"</span></div>"+chatMonitor.innerHTML;
    
    var allChatMessages = document.getElementsByClassName("chat_message");
    if(allChatMessages.length > 120){
        chatMonitor.removeChild(allChatMessages[allChatMessages.length-1]);
    }
}

function urlify(text){
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url){
        return '<a href="'+url+'" target="_blank">' + url + '</a>';
    });
}

function ObjectLength( object ) {
    var length = 0;
    for( var key in object ) {
        if( object.hasOwnProperty(key) ) {
            ++length;
        }
    }
    return length;
};

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function escapeHTML(str){
    str = str + "";
    var out = "";
    for(var i=0; i<str.length; i++){
        if(str[i] === '<') {
            out += '&lt;';
        } else if(str[i] === '>'){
            out += '&gt;';
        } else if(str[i] === "'"){
            out += '&#39;'; 
        } else if(str[i] === '"'){
            out += '&#34;';                        
        } else if(str[i] === '%'){
            out += '&#37;';
        } else if(str[i] === '\\'){
            out += '&#92;';
        } else if(str[i] === '¢'){
            out += '&#162;';
        } else if(str[i] === '¼'){
            out += '&#188;';
        } else if(str[i] === '½'){
            out += '&#189;';
        } else if(str[i] === '¾'){
            out += '&#190;';
        } else if(str[i] === '#'){
            out += '&#35;';
        } else if(str[i] === '&' && str[i+1] === '#'){
            out += '&#38;';
        } else {
            out += str[i];
        }
    }
    return out;                    
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
