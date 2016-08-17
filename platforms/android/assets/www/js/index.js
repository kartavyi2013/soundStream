



(function () {
    var params = {},
            r = /([^&=]+)=?([^&]*)/g;
    function d(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    }
    var match, search = window.location.search;
    while (match = r.exec(search.substring(1))) {
        params[d(match[1])] = d(match[2]);
        if (d(match[2]) === 'true' || d(match[2]) === 'false') {
            params[d(match[1])] = d(match[2]) === 'true' ? true : false;
        }

    }
    window.params = params;
})();
var recordingDIV = document.querySelector('.recordrtc');
var recordingMedia = {};
recordingDIV.querySelector('.recording-media');
recordingMedia.value = 'record-audio';
var recordingPlayer = recordingDIV.querySelector('video');
var mediaContainerFormat = recordingDIV.querySelector('.media-container-format');

//                $('#startRecord').click() = function () {
recordingDIV.querySelector('button').onclick = function () {
    var button = this;

    if (button.innerHTML === 'Stop Recording') {
        button.disabled = true;
        button.disableStateWaiting = true;
        setTimeout(function () {
            button.disabled = false;
            button.disableStateWaiting = false;
        }, 2 * 1000);

        button.innerHTML = 'Star Recording';
        function stopStream() {
            if (button.stream && button.stream.stop) {
                button.stream.stop();
                button.stream = null;
//                               recordingDIV.querySelector('#upload-to-server').click();
            }
        }

        if (button.recordRTC) {
            if (button.recordRTC.length) {
                button.recordRTC[0].stopRecording(function (url) {
                    if (!button.recordRTC[1]) {
//                                        button.recordingEndedCallback(url);
                        stopStream();
                        saveToDiskOrOpenNewTab(button.recordRTC[0]);
                        return;
                    }
                    button.recordRTC[1].stopRecording(function (url) {
//                                        button.recordingEndedCallback(url);
                        stopStream();
                    });
                });
            }
            else {
                button.recordRTC.stopRecording(function (url) {
//                                    button.recordingEndedCallback(url);
                    stopStream();
                    saveToDiskOrOpenNewTab(button.recordRTC);
                });
            }
        }

        return;
    }

    button.disabled = true;

    var commonConfig = {
        onMediaCaptured: function (stream) {
            button.stream = stream;
            if (button.mediaCapturedCallback) {
                button.mediaCapturedCallback();
            }
            button.innerHTML = 'Stop Recording';
            button.disabled = false;
        },
        onMediaStopped: function () {
            button.innerHTML = 'Start Recording';

            if (!button.disableStateWaiting) {
                button.disabled = false;
            }
        },
        onMediaCapturingFailed: function (error) {
            if (error.name === 'PermissionDeniedError' && !!navigator.mozGetUserMedia) {
                InstallTrigger.install({
                    'Foo': {
                        // https://addons.mozilla.org/firefox/downloads/latest/655146/addon-655146-latest.xpi?src=dp-btn-primary
                        URL: 'https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/',
                        toString: function () {
                            return this.URL;
                        }
                    }
                });
            }

            commonConfig.onMediaStopped();
        }
    };



    if (recordingMedia.value === 'record-audio') {
        captureAudio(commonConfig);

        button.mediaCapturedCallback = function () {
            button.recordRTC = RecordRTC(button.stream, {
                type: 'audio',
                bufferSize: typeof params.bufferSize == 'undefined' ? 0 : parseInt(params.bufferSize),
                sampleRate: typeof params.sampleRate == 'undefined' ? 44100 : parseInt(params.sampleRate),
                leftChannel: params.leftChannel || false,
                disableLogs: params.disableLogs || false,
                recorderType: webrtcDetectedBrowser === 'edge' ? StereoAudioRecorder : null
            });

//                            button.recordingEndedCallback = function (url) {
//                                var audio = new Audio();
//                                audio.src = url;
//                                audio.controls = true;
//                                recordingPlayer.parentNode.appendChild(document.createElement('hr'));
//                                recordingPlayer.parentNode.appendChild(audio);
//                                if (audio.paused)
//                                    audio.play();
//                                audio.onended = function () {
//                                    audio.pause();
//                                    audio.src = URL.createObjectURL(button.recordRTC.blob);
//                                };
//                            };

            button.recordRTC.startRecording();
        };
    }

};
function captureVideo(config) {
    captureUserMedia({video: true}, function (videoStream) {
        recordingPlayer.srcObject = videoStream;
        recordingPlayer.play();

        config.onMediaCaptured(videoStream);

        videoStream.onended = function () {
            config.onMediaStopped();
        };
    }, function (error) {
        config.onMediaCapturingFailed(error);
    });
}

function captureAudio(config) {
    captureUserMedia({audio: true}, function (audioStream) {
        recordingPlayer.srcObject = audioStream;
        recordingPlayer.play();

        config.onMediaCaptured(audioStream);

        audioStream.onended = function () {
            config.onMediaStopped();
        };
    }, function (error) {
        config.onMediaCapturingFailed(error);
    });
}
function captureAudioPlusVideo(config) {
    captureUserMedia({video: true, audio: true}, function (audioVideoStream) {
        recordingPlayer.srcObject = audioVideoStream;
        recordingPlayer.play();

        config.onMediaCaptured(audioVideoStream);

        audioVideoStream.onended = function () {
            config.onMediaStopped();
        };
    }, function (error) {
        config.onMediaCapturingFailed(error);
    });
}

function captureScreen(config) {
    getScreenId(function (error, sourceId, screenConstraints) {
        if (error === 'not-installed') {
            document.write('<h1><a target="_blank" href="https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk">Please install this chrome extension then reload the page.</a></h1>');
        }
        if (error === 'permission-denied') {
            alert('Screen capturing permission is denied.');
        }
        if (error === 'installed-disabled') {
            alert('Please enable chrome screen capturing extension.');
        }

        if (error) {
            config.onMediaCapturingFailed(error);
            return;
        }
        captureUserMedia(screenConstraints, function (screenStream) {
            recordingPlayer.srcObject = screenStream;
            recordingPlayer.play();

            config.onMediaCaptured(screenStream);

            screenStream.onended = function () {
                config.onMediaStopped();
            };
        }, function (error) {
            config.onMediaCapturingFailed(error);
        });
    });
}
function captureAudioPlusScreen(config) {
    getScreenId(function (error, sourceId, screenConstraints) {
        if (error === 'not-installed') {
            document.write('<h1><a target="_blank" href="https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk">Please install this chrome extension then reload the page.</a></h1>');
        }
        if (error === 'permission-denied') {
            alert('Screen capturing permission is denied.');
        }
        if (error === 'installed-disabled') {
            alert('Please enable chrome screen capturing extension.');
        }

        if (error) {
            config.onMediaCapturingFailed(error);
            return;
        }
        screenConstraints.audio = true;
        captureUserMedia(screenConstraints, function (screenStream) {
            recordingPlayer.srcObject = screenStream;
            recordingPlayer.play();

            config.onMediaCaptured(screenStream);

            screenStream.onended = function () {
                config.onMediaStopped();
            };
        }, function (error) {
            config.onMediaCapturingFailed(error);
        });
    });
}

function captureUserMedia(mediaConstraints, successCallback, errorCallback) {
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
}

function setMediaContainerFormat(arrayOfOptionsSupported) {
    var options = Array.prototype.slice.call(
            mediaContainerFormat.querySelectorAll('option')
            );

    var selectedItem;
    options.forEach(function (option) {
        option.disabled = true;

        if (arrayOfOptionsSupported.indexOf(option.value) !== -1) {
            option.disabled = false;

            if (!selectedItem) {
                option.selected = true;
                selectedItem = option;
            }
        }
    });
}

recordingMedia.onchange = function () {
    if (this.value === 'record-audio') {
        setMediaContainerFormat(['WAV', 'Ogg']);
        return;
    }
    setMediaContainerFormat(['WebM', /*'Mp4',*/ 'Gif']);
};


function saveToDiskOrOpenNewTab(recordRTC) {
//                    recordingDIV.querySelector('#save-to-disk').parentNode.style.display = 'block';
//                    recordingDIV.querySelector('#save-to-disk').onclick = function () {
//                        if (!recordRTC)
//                            return alert('No recording found.');
//
//                        recordRTC.save();
//                    };
//
//                    recordingDIV.querySelector('#open-new-tab').onclick = function () {
//                        if (!recordRTC)
//                            return alert('No recording found.');
//
//                        window.open(recordRTC.toURL());
//                    };
//                    recordingDIV.querySelector('#upload-to-server').disabled = false;

//                    recordingDIV.querySelector('#upload-to-server').onclick = function () {
    if (!recordRTC)
        return alert('No recording found.');
    this.disabled = true;

    var button = this;
    uploadToServer(recordRTC, function (progress, fileURL) {
        if (progress === 'ended') {
            console.log("END Succesfully");
//                            button.disabled = false;
//                            button.innerHTML = 'Click to download from server';
//                            button.onclick = function () {
//                                window.open(fileURL);
//                            };
            return;
        }
        button.innerHTML = progress;
    });
//                    };

}

var listOfFilesUploaded = [];
function uploadToServer(recordRTC, callback) {
    var blob = recordRTC instanceof Blob ? recordRTC : recordRTC.blob;
    var fileType = blob.type.split('/')[0] || 'audio';
    var fileName = (Math.random() * 1000).toString().replace('.', '');
    if (fileType === 'audio') {
        fileName += '.' + (!!navigator.mozGetUserMedia ? 'ogg' : 'wav');
    } else {
        fileName += '.webm';
    }
    // create FormData
    var formData = new FormData();
    formData.append(fileType + '-filename', fileName);
    formData.append(fileType + '-blob', blob);
    callback('Uploading ' + fileType + ' recording to server.');
    makeXMLHttpRequest('http://192.168.1.114/api/web/v1/sound/upload', formData, function (progress) {
        if (progress !== 'upload-ended') {
            callback(progress);
            return;
        }
        var initialURL = location.href.replace(location.href.split('/').pop(), '') + 'uploads/';
        callback('ended', initialURL + fileName);
        // to make sure we can delete as soon as visitor leaves
        listOfFilesUploaded.push(initialURL + fileName);
    });
}

function makeXMLHttpRequest(url, data, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState == 4 && request.status == 200) {
            callback('upload-ended');
        }
    };
    request.upload.onloadstart = function () {
        callback('Upload started...');
    };
    request.upload.onprogress = function (event) {
        callback('Upload Progress ' + Math.round(event.loaded / event.total * 100) + "%");
    };
    request.upload.onload = function () {
        callback('progress-about-to-end');
    };
    request.upload.onload = function () {
        callback('progress-ended');
    };
    request.upload.onerror = function (error) {
        callback('Failed to upload to server');
        console.error('XMLHttpRequest failed', error);
    };
    request.upload.onabort = function (error) {
        callback('Upload aborted.');
        console.error('XMLHttpRequest aborted', error);
    };
    request.open('POST', url);
    request.send(data);
}
window.onbeforeunload = function () {
    recordingDIV.querySelector('button').disabled = false;
    recordingMedia.disabled = false;
    mediaContainerFormat.disabled = false;
    if (!listOfFilesUploaded.length)
        return;
    listOfFilesUploaded.forEach(function (fileURL) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                if (this.responseText === ' problem deleting files.') {
                    alert('Failed to delete ' + fileURL + ' from the server.');
                    return;
                }
                listOfFilesUploaded = [];
                alert('You can leave now. Your files are removed from the server.');
            }
        };
        request.open('POST', 'delete.php');
        var formData = new FormData();
        formData.append('delete-file', fileURL.split('/').pop());
        request.send(formData);
    });
    return 'Please wait few seconds before your recordings are deleted from the server.';
};
           