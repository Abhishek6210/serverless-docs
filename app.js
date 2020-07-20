//=============== AWS Cognito IDs ===============
const userPoolId = 'ap-southeast-1_lBwBP9VEb'; 
const clientId = '7fdcfo50mhcqm5ui0pl0lrc88f';
const region = 'ap-southeast-1';
const identityPoolId = 'ap-southeast-1:09230717-dc81-41c2-9847-4d0504a8ff9f';
const S3DocBucket = "cognito-doc-management";
//==============================


var cognitoUser;
var idToken;
var userPool;

var poolData = { 
    UserPoolId : userPoolId,
    ClientId : clientId
};

getCurrentLoggedInSession();

function switchToVerificationCodeView(){
    $("#emailInput").hide();
    $("#userNameInput").hide();
    $("#passwordInput").hide();
    $("#confirmPasswordInput").hide();
    $("#logInButton").hide();
    $("#registerButton").hide();
    $("#bucketNameInput").hide();
    $("#verificationCodeInput").show();
    $("#verifyCodeButton").show();
    $("#listPublicFiles").hide();
    $("#listMyFiles").hide();
    $("#logOutButton").hide();
    $("#file-upload-ctl").hide();
}

function switchToRegisterView(){
    $("#emailInput").show();
    $("#userNameInput").show();
    $("#passwordInput").show();
    $("#confirmPasswordInput").show();
    $("#logInButton").hide();
    $("#registerButton").show();
    $("#verificationCodeInput").hide();
    $("#verifyCodeButton").hide();
    $("#listPublicFiles").hide();
    $("#listMyFiles").hide();
    $("#logOutButton").hide();
    $("#file-upload-ctl").hide();
}

function switchToLogInView(){
    $("#userNameInput").val('');
    $("#passwordInput").val('');
    $("#emailInput").hide();
    $("#userNameInput").show();
    $("#passwordInput").show();
    $("#confirmPasswordInput").hide();
    $("#logInButton").show();
    $("#registerButton").show();
    $("#verificationCodeInput").hide();
    $("#verifyCodeButton").hide();
    $("#listPublicFiles").hide();
    $("#listMyFiles").hide();
    $("#logOutButton").hide();
    $("#file-upload-ctl").hide();
    $("#public-files").hide().find('tbody').html("");
    $("#my-files").hide().find('tbody').html("");
}

function switchToLoggedInView(){
    $("#emailInput").hide();
    $("#userNameInput").hide();
    $("#passwordInput").hide();
    $("#confirmPasswordInput").hide();
    $("#logInButton").hide();
    $("#registerButton").hide();
    $("#verificationCodeInput").hide();
    $("#verifyCodeButton").hide();
    $("#listPublicFiles").show();
    $("#listMyFiles").show();
    $("#logOutButton").show();
    $("#file-upload-ctl").css('display', 'inline-block');
}

function clearLogs(){
    $('#log').empty();
}

/*
Starting point for user logout flow
*/
function logOut(){
    clearLogs();
    if (cognitoUser != null) {
        $("#loader").show();
        cognitoUser.signOut();
        switchToLogInView();
        logMessage('Logged out!', 'blue');
        $("#loader").hide();
    }
}

/*
Starting point for user login flow with input validation
*/
function logIn(){
    clearLogs();
    if(!$('#userNameInput').val() || !$('#passwordInput').val()){
        logMessage('Please enter Username and Password!', 'red');
    }else{
        var authenticationData = {
            Username : $('#userNameInput').val(),
            Password : $("#passwordInput").val(),
        };
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

        var userData = {
            Username : $('#userNameInput').val(),
            Pool : userPool
        };
        cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        $("#loader").show();
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                logMessage('Logged in!', 'blue');
                switchToLoggedInView();

                idToken = result.getIdToken().getJwtToken();
                getCognitoIdentityCredentials();
            },

            onFailure: function(err) {
                logMessage(err.message, 'red');
                $("#loader").hide();
            },

        });
    }
}

/*
Starting point for user registration flow with input validation
*/
function register(){
    // clearLogs();
    switchToRegisterView();

    if( !$('#emailInput').val() || !$('#userNameInput').val()  || !$('#passwordInput').val() || !$('#confirmPasswordInput').val() ) {
            logMessage('Please fill all the fields!', 'red');
    }else{
        if($('#passwordInput').val() == $('#confirmPasswordInput').val()){
            registerUser($('#emailInput').val(), $('#userNameInput').val(), $('#passwordInput').val());
        }else{
            logMessage('Confirm password failed!', 'red');
        }
        
    }
}

/*
Starting point for user verification using AWS Cognito with input validation
*/
function verifyCode(){
    // clearLogs();
    if( !$('#verificationCodeInput').val() ) {
        logMessage('Please enter verification field!', 'red');
    }else{
        $("#loader").show();
        cognitoUser.confirmRegistration($('#verificationCodeInput').val(), true, function(err, result) {
            if (err) {
                logMessage(err.message, 'red');
            }else{
                logMessage('Successfully verified code!', 'blue');
                switchToLogInView();
            }
            
            $("#loader").hide();
        });
    }
}

/*
User registration using AWS Cognito
*/
function registerUser(email, username, password){
    // clearLogs();
    var attributeList = [];
    
    var dataEmail = {
        Name : 'email',
        Value : email
    };

    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);

    attributeList.push(attributeEmail);

    $("#loader").show();
    userPool.signUp(username, password, attributeList, null, function(err, result){
        if (err) {
            if(err.message.includes('EMAIL_DOMAIN_ERR')){
                logMessage('Your email or domain is not valid. Please signup with your company email.', 'red');
            }else{
                logMessage(err.message, 'red');
            }            
        }else{
            cognitoUser = result.user;
            logMessage('Registration Successful!');
            logMessage('Username is: ' + cognitoUser.getUsername());
            logMessage('Please enter the verification code sent to your Email.');
            switchToVerificationCodeView();
        }
        $("#loader").hide();
    });
}

/*
Starting point for AWS List S3 Objects flow with input validation
*/
function listPublicFiles(){
    // clearLogs();    
    $("#loader").show();
    logMessage('Listing Public Files', 'blue')
    listFiles('public-files/', 'public-files', false);    
}

function listMyFiles(){
    // clearLogs();    
    logMessage('Listing My Own Files', 'blue')
    $("#loader").show();
    listFiles(`users/${getUserId()}/`, 'my-files', true);
}

/*
This method will get temporary credentials for AWS using the IdentityPoolId and the Id Token recieved from AWS Cognito authentication provider.
*/
function getCognitoIdentityCredentials(){
    AWS.config.region = region;

    var loginMap = {};
    loginMap['cognito-idp.' + region + '.amazonaws.com/' + userPoolId] = idToken;

    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: identityPoolId,
        Logins: loginMap
    });

    AWS.config.credentials.clearCachedId();

    AWS.config.credentials.get(function(err) {
        if (err){
            logMessage(err.message, 'red');
        }
        else {
            logMessage('AWS Access Key: '+ AWS.config.credentials.accessKeyId);
            logMessage('AWS Secret Key: '+ AWS.config.credentials.secretAccessKey);
            logMessage('AWS Session Token: '+ AWS.config.credentials.sessionToken);
        }

        $("#loader").hide();
    });
}

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

/*
This method will use AWS S3 SDK to get a list of S3 bucket object.
Before using this method, AWS Credentials must be set in AWS config.
*/
function listFiles(folder, id, hasDelete){            
    var s3 = new AWS.S3();

    var params = {
        Bucket: S3DocBucket,
        Prefix: folder
    };
    s3.listObjects(params, function(err, data) {
        if (err) logMessage(err.message, 'red');
        else{
            logMessage(`${data.Contents.length} File(s) Found`, 'blue');
            const table = $(`#${id}`);
            table.show();
            table.find('tbody').html("");
            data.Contents.forEach(element => {
                console.log(element)
                const file = element.Key.split('/')[element.Key.split('/').length-1];
                if(file) {
                    logMessage(`${file} | ${bytesToSize(element.Size)}`, "#007cff");

                    downloadBtn = `<button class="button is-small is-success" onclick="downloadFile('${element.Key}')">Download</button>`
                    deleteBtn = hasDelete ? `<button class="button is-small is-danger" onclick="deleteFile('${element.Key}')">Delete</button>` : ''
                    table.find('tbody').append(`<tr>
                        <td>${file}</td>
                        <td>${bytesToSize(element.Size)}</td>
                        <td>${element.LastModified.toGMTString()}</td>
                        <td>
                            ${downloadBtn}
                            ${deleteBtn}
                        </td>                        
                        </tr>`)
                }
            });            
        }
        $("#loader").hide();
    });
}

function downloadFile(file){
    logMessage(`Downloading file ${file}`, "blue");

    var s3 = new AWS.S3();
    var params = {Bucket: S3DocBucket, Key: file};
    var url = s3.getSignedUrl('getObject', params);

    window.open(url);
}

function deleteFile(file){
    logMessage(`Deleting file ${file}`, 'red');
    var s3 = new AWS.S3();
    var params = { Bucket: S3DocBucket, Key: file };
    s3.deleteObject(params, function(err, data) {
        if(err){
            logMessage(`Failed to delete ${err.message}`, 'red');
        }else{
            logMessage('File deleted', 'blue');
        }
    });
}

/*
If user has logged in before, get the previous session so user doesn't need to log in again.
*/
function getCurrentLoggedInSession(){
    $("#loader").show();
    try{
        userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        cognitoUser = userPool.getCurrentUser();    

        if(cognitoUser != null){
            cognitoUser.getSession(function(err, session) {
                if (err) {
                    logMessage(err.message, 'red');
                }else{
                    console.log('Cognito Session', session);
                    logMessage(`Session found! ${session.accessToken.payload.username} logged-in.`, 'blue');
                    switchToLoggedInView();
                    idToken = session.getIdToken().getJwtToken();
                    getCognitoIdentityCredentials();
                    const expiry = new Date(0);
                    expiry.setUTCSeconds(session.accessToken.payload.exp);
                    logMessage(`This session will expire at ${expiry}`, '#fd6a69')

                }                
            });
        }else{
            logMessage('Session expired. Please log in again.', 'orange');
            $("#loader").hide();
        }
    }catch(e){
        logMessage(`${e.message}`, 'red');
    }
    $("#loader").hide();
}

function getUserId(){
    const key = `aws.cognito.identity-id.${identityPoolId}`;
    return cognitoUser.pool.storage[key];
}

function uploadFile(){
    logMessage('Uploading New File', 'blue')
    var files = document.getElementById("file-upload").files;
    if (!files.length) {
        return alert("Please choose a file to upload first.");
    }
    var file = files[0];
    var fileName = file.name;    
    var fileKey = `users/${getUserId()}/${fileName}`;

    // Use S3 ManagedUpload class as it supports multipart uploads
    var upload = new AWS.S3.ManagedUpload({
        params: {
            Bucket: S3DocBucket,
            Key: fileKey,
            Body: file        
        }
    });

    upload.promise()
    .then((data) => {
        logMessage(`Successfully uploaded file.`, "blue");            
    },(err) => {
        logMessage(`There was an error uploading your file: ${err.message}`, "red");
    });
}

/*
This is a logging method that will be used throught the application
*/
function logMessage(message, color){
    $('#log').append(`<span style='color: ${color}'>${message}</span></br>`);
}