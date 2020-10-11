function usePattern() {
    var self = this,
        offset_x = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
        offset_y = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0,
        ftwCheck = arguments.length > 2 && void 0 !== arguments[2] && arguments[2],
        isShuffleArr = arguments.length > 3 && void 0 !== arguments[3] && arguments[3];

    function shuffleArr(e) {
        e.sort(function () {
            return Math.random() - 0.5;
        });
    }

    var fileInpit = document.createElement('input');
    fileInpit.setAttribute('type', 'file');

    var startLoad = function () {
        console.log(fileInpit.files[0]);
        var imageObj = new Image();

        let s = (function () {
            var i = Object(_Users_i_nedzvetskiy_projects_pixel_frontend_node_modules_babel_preset_react_app_node_modules_babel_runtime_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_2__.a)(
                _Users_i_nedzvetskiy_projects_pixel_frontend_node_modules_babel_preset_react_app_node_modules_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.mark(function i() {
                    var xCanvas, xCtx, arColors, fullSize, xPercentage, mainIterIndex, pixBuff, m, newPixBuff, imageDataBuff, E_gggggg, b, g;

                    return _Users_i_nedzvetskiy_projects_pixel_frontend_node_modules_babel_preset_react_app_node_modules_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.wrap(function (i) {
                        for (;;)
                            switch ((i.prev = i.next)) {
                                case 0:
                                    console.log('Loaded', [imageObj.width, imageObj.height]);
                                        ((xCanvas = document.createElement('canvas')).width = imageObj.width),
                                            (xCanvas.height = imageObj.height),
                                            (xCtx = xCanvas.getContext('2d')).drawImage(imageObj, 0, 0),
                                            (arColors = Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.d)()),
                                            (fullSize = imageObj.width * imageObj.height),
                                            (xPercentage = 0),
                                            (mainIterIndex = 0),
                                            (pixBuff = []);
                                    for (
                                          let  m = 0;
                                        m < fullSize;
                                        m++
                                    )
                                        pixBuff.push(m);

                                        isShuffleArr && shuffleArr(pixBuff),
                                        (newPixBuff = []),
                                        console.log('Start sendPixel'),
                                        (imageDataBuff = Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.h)(
                                            xCtx,
                                            0,
                                            0,
                                            imageObj.width,
                                            imageObj.height
                                        )),
                                        (E_gggggg = Object(_modules_Game__WEBPACK_IMPORTED_MODULE_6__.h)(
                                            self.context,
                                            0,
                                            0,
                                            _constants__WEBPACK_IMPORTED_MODULE_14__.b,
                                            _constants__WEBPACK_IMPORTED_MODULE_14__.a
                                        )),
                                        (b = _Users_i_nedzvetskiy_projects_pixel_frontend_node_modules_babel_preset_react_app_node_modules_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.mark(
                                            function r(omgggg) {
                                                var buffVal, _x_, _y_, prIndex, _mb_colorId, actualColorz, O_pixel, w_TFFF;
                                                // return console.log('testBreak');
                                                return _Users_i_nedzvetskiy_projects_pixel_frontend_node_modules_babel_preset_react_app_node_modules_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_1___default.a.wrap(
                                                    function (r) {
                                                        for (;;)
                                                            switch ((r.prev = r.next)) {
                                                                case 0:
                                                                    if (
                                                                        ((buffVal = pixBuff[omgggg]),
                                                                        (_x_ = buffVal % imageObj.width),
                                                                        (_y_ = Math.floor(buffVal / imageObj.width)),
                                                                        (prIndex = mainIterIndex++),
                                                                        xPercentage !== Math.round(((prIndex / fullSize) * 100) / 10) &&
                                                                            ((xPercentage = Math.round(((prIndex / fullSize) * 100) / 10)),
                                                                            console.log('Process:', xPercentage)),
                                                                        (_mb_colorId = Object(
                                                                            // parse colorId from hex color
                                                                            _modules_Game__WEBPACK_IMPORTED_MODULE_6__.j
                                                                        )(
                                                                            Object(
                                                                                // get pixel color hex
                                                                                _modules_Game__WEBPACK_IMPORTED_MODULE_6__.i
                                                                            )(imageDataBuff, _x_, _y_, imageObj.width)
                                                                        )),
                                                                        (actualColorz = arColors.reduce(
                                                                            function (prevVal, curVal) {
                                                                                var n = Math.abs(
                                                                                    _mb_colorId -
                                                                                        Object(
                                                                                            _modules_Game__WEBPACK_IMPORTED_MODULE_6__.j
                                                                                        )(curVal)
                                                                                );
                                                                                return n < prevVal.diff
                                                                                    ? {
                                                                                          diff: n,
                                                                                          c: curVal,
                                                                                      }
                                                                                    : prevVal;
                                                                            },
                                                                            {
                                                                                diff: Math.abs(
                                                                                    Object(
                                                                                        _modules_Game__WEBPACK_IMPORTED_MODULE_6__.j
                                                                                    )(_mb_colorId) -
                                                                                        Object(
                                                                                            _modules_Game__WEBPACK_IMPORTED_MODULE_6__.j
                                                                                        )(arColors[0])
                                                                                ),
                                                                                c: arColors[0],
                                                                            }
                                                                        )),
                                                                        !(O_pixel = new _Pixel__WEBPACK_IMPORTED_MODULE_7__.a(
                                                                            _x_ + offset_x,
                                                                            _y_ + offset_y,
                                                                            arColors.indexOf(actualColorz.c),
                                                                            0,
                                                                            0,
                                                                            0
                                                                        )).isValid())
                                                                    ) {
                                                                        r.next = 34;
                                                                        break;
                                                                    }
                                                                    if (((w_TFFF = 200), !ftwCheck)) {
                                                                        r.next = 28;
                                                                        break;
                                                                    }
                                                                    if (
                                                                        '#FFFFFF' !==
                                                                        Object(
                                                                            // get pixel color hex
                                                                            _modules_Game__WEBPACK_IMPORTED_MODULE_6__.i
                                                                        )(
                                                                            E_gggggg,
                                                                            O_pixel.x,
                                                                            O_pixel.y,
                                                                            _constants__WEBPACK_IMPORTED_MODULE_14__.b
                                                                        )
                                                                    ) {
                                                                        r.next = 23;
                                                                        break;
                                                                    }
                                                                    if ((newPixBuff.push(O_pixel), !(newPixBuff.length >= w_TFFF))) {
                                                                        r.next = 18;
                                                                        break;
                                                                    }
                                                                    return (
                                                                        self.sendBufferPixel(newPixBuff),
                                                                        (newPixBuff = []),
                                                                        (r.next = 18),
                                                                        Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.e)(
                                                                            20
                                                                        )
                                                                    );
                                                                case 18:
                                                                    if (newPixBuff.length % 10 !== 0) {
                                                                        r.next = 21;
                                                                        break;
                                                                    }
                                                                    return (
                                                                        (r.next = 21),
                                                                        Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.e)(
                                                                            16
                                                                        )
                                                                    );
                                                                case 21:
                                                                    r.next = 26;
                                                                    break;
                                                                case 23:
                                                                    if (omgggg % 1e3 !== 0) {
                                                                        r.next = 26;
                                                                        break;
                                                                    }
                                                                    return (
                                                                        (r.next = 26),
                                                                        Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.e)(
                                                                            16
                                                                        )
                                                                    );
                                                                case 26:
                                                                    r.next = 34;
                                                                    break;
                                                                case 28:
                                                                    if ((newPixBuff.push(O_pixel), !(newPixBuff.length >= w_TFFF))) {
                                                                        r.next = 34;
                                                                        break;
                                                                    }
                                                                    return (
                                                                        self.sendBufferPixel(newPixBuff),
                                                                        (newPixBuff = []),
                                                                        (r.next = 34),
                                                                        Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.e)(
                                                                            20
                                                                        )
                                                                    );
                                                                case 34:
                                                                    (0 !== omgggg &&
                                                                        100 !== omgggg &&
                                                                        1e3 !== omgggg &&
                                                                        1e4 !== omgggg &&
                                                                        1e6 !== omgggg) ||
                                                                        console.log('Send pixel:', omgggg);
                                                                case 35:
                                                                case 'end':
                                                                    return r.stop();
                                                            }
                                                    },
                                                    r
                                                );
                                            }
                                        )),
                                        (g = 0);

                                case 19:
                                    if (!(g < fullSize)) {
                                        i.next = 24;
                                        break;
                                    }
                                    return i.delegateYield(b(g), 't0', 21);

                                case 21:
                                    g++, (i.next = 19);
                                    break;

                                case 24:
                                    if (!newPixBuff.length) {
                                        i.next = 28;
                                        break;
                                    }
                                    return (
                                        self.sendBufferPixel(newPixBuff),
                                        (i.next = 28),
                                        Object(_helpers__WEBPACK_IMPORTED_MODULE_5__.e)(20)
                                    );

                                case 28:
                                case 'end':
                                    return i.stop();
                            }
                    }, i);
                })
            );

            return function () {
                return i.apply(this, arguments);
            };
        })();

        imageObj.onload = function () {
            s()
                .then(function () {
                    return console.log('Done');
                })
                .catch(function (e) {
                    console.error(e);
                });
        };

        console.log('start load');
        imageObj.src = URL.createObjectURL(fileInpit.files[0]);
    };

    fileInpit.onchange = function (e) {
        startLoad();
    };
    fileInpit.click();
}
