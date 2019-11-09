(function( $ ) {
    $( document ).ready(function() {

		/**
		 * Виджет "libajax".
		 */
		$.widget( "lib.ajax", {

			/**
    		 * @type {string}
    		 *		Адрес запроса AJAX кода.
    		 */
    		_urlAjax: null,

			/**
             * @type {string}
             *		Метод отправки данных на сервер ( GET|POST ).
             */
            _method: "GET",

            /**
             * @type {string}
             *		Тип возвращаемого объекта AJAX-кодом ( html|json|xml|script|text ).
             */
            _datatype: "html",

			/**
			 * @type {boolean}
			 *		Кеширование AJAX-запроса.
			 */
			_cache: false,

			/**
			 * @type {boolean}
			 *		Асинхронное выполнение запроса.
			 */
			_async: true,

			/**
			 * @type {string}
			 *		Имя запроса (идентификатор запроса).
			 */
			_namequery: null,

			/**
			 * @type {array}
			 *		Объект AJAX-запроса.
			 */
			_xhr: [],
			
			/**
			 * @type {array}
			 *		Указывает на блокировку.
			 */
			_lock: [],

			/**
			 * @type {boolean}
			 *		Указывает на необходимость блокировки.
			 */
			_block: false,
			
			/**
			 * @type {int}
			 *		Идентификатор таймера.
			 */
			_timerId: null,
			
			/**
			 * @type {int}
			 *		Время в миллисекундах через которое сработает AJAX-запрос.
			 */
			_time: 5000,

			/**
			 * Список значений и настроек по умолчанию.
			 *
			 * @param {string} idModal_error
			 *		id модального окна, если необходимо показывать AJAX-ошибку в модальном окне.
			 */
			options: {
                idModal_error: null,
            },

			/**
			 * Конструктор плагина.
			 */
    		_create: function() {},

			/**
			 * Параметры для AJAX-запроса, которые будут использоваться по умолчанию.
			 */
			_settings: function() {
				var mythis = this;
				// Параметры, которые будут использоваться по умолчанию.
				$.ajaxSetup({
					url: mythis._urlAjax,
					async: mythis._async,
					type: mythis._method,
					cache: mythis._cache,
					dataType: mythis._datatype,
					beforeSend: function( xhr ) {
						// Перед отправкой AJAX-запроса.
						if ( mythis._method == "POST" ) {
							xhr.setRequestHeader( 'X-CSRF-Token', $( 'input[name="_csrfToken"]' ).val() );
						}
						// Блокируем остальные AJAX-запросы.
						if ( mythis._block ) {
							let name = mythis._namequery;
							mythis._lock[name] = 1;
						}
						// Метод, который вызывается перед отправкой AJAX-запроса.
						let querySend = '_' + mythis._namequery + 'Send';
						if ( querySend in mythis ) mythis[querySend]( xhr );
					},
					success: function( data, textStatus, request ) {
						// Принимаем в заголовке токен и изменяем значение скрытого поля "_csrfToken".
						var token = request.getResponseHeader('X-CSRF-Token');
						$( 'input[name="_csrfToken"]' ).val( token );
						// Разблокируем AJAX-запросы.
						let name = mythis._namequery;
						mythis._lock[name] = 0;
						// Метод, который вызывается после успешного выполнения AJAX-кода.
						let querySuccess = '_' + mythis._namequery + 'Success';
						if ( querySuccess in mythis ) mythis[querySuccess]( data );
					},
					error: function( data ) {
						// Сбой.
						mythis._errorCode( data );
						// Разблокируем AJAX-запросы.
						let name = mythis._namequery;
						mythis._lock[name] = 0;
					},
				});
			},

			/**
			 * Ошибка при запросе.
			 *
			 * @param {object} data
			 * 		Данные, которые вернулись от AJAX запроса.
			 */
            _errorCode: function( data ) {
                // Инициализация модального окна.
                if ( this.options.idModal_error ) {
                    $( '#' + this.options.idModal_error ).modal();
                    $( '#' + this.options.idModal_error ).modal( 'open' );
                    this._error( data );
                }
                else {
                    alert( 'На сервере произошла ошибка! Приносим свои извинения.' );
                    console.log( data );
                    this._error( data );
                }
            },

			/**
			 * Ошибка в запросе.
			 *
			 * @param {object} data
			 * 		Данные, которые вернулись от AJAX запроса.
			 */
            _error: function( data ) {},

			/**
			 * Запускает AJAX-запрос, используя настройки $.ajaxSetup().
			 *
			 * @param {object} mydata
			 * 		Данные, которые необходимо передать в AJAX запросе.
			 */
			_ajax: function( mydata ) {
				var data = mydata;
				let name = this._namequery;
				this._settings();
				this._xhr[name] = $.ajax({ data: data });
			},

			/**
			 * Простой AJAX-запрос.
			 *
			 * @param {object} mydata
			 * 		Данные, которые необходимо передать в AJAX запросе.
			 * @param {string} nameq
			 * 		Идентификатор AJAX-запроса.
			 */
			_Ajax: function( mydata, nameq ) {
				this._block = false;
				this._namequery = nameq;
				this._ajax( mydata );
			},

			/**
			 * AJAX-запрос с блокировкой.
			 *
			 * @param {object} mydata
			 * 		Данные, которые необходимо передать в AJAX запросе.
			 * @param {string} nameq
			 * 		Идентификатор AJAX-запроса.
			 */
			_lockAjax: function( mydata, nameq ) {
				this._block = true;
				if ( this._lock[nameq] === undefined || this._lock[nameq] === 0 ) {
					this._namequery = nameq;
					this._ajax( mydata );
				}
			},

			/**
			 * AJAX-запрос с удалением "слушателя".
			 *
			 * @param {object} mydata
			 * 		Данные, которые необходимо передать в AJAX запросе.
			 * @param {string} nameq
			 * 		Идентификатор AJAX-запроса.
			 */
			_abortAjax: function( mydata, nameq ) {
				this._block = false;
				this._Ajax( mydata, nameq );
				this._xhr[nameq].abort();
			},

			/**
			 * AJAX-запрос, выполняющийся по таймеру.
			 *
			 * @param {object} mydata
			 * 		Данные, которые необходимо передать в AJAX запросе.
			 * @param {string} nameq
			 * 		Идентификатор AJAX-запроса.
			 */
			_timerAjax: function( mydata, nameq ) {
				var myThis = this;
				var data = mydata;
				var name = nameq;
				this._timerId = setTimeout(function tick() {
					myThis._lockAjax( data, name );
					myThis.timerId = setTimeout( tick, myThis._time );
				}, this._time );
			},

		});

    });
})( jQuery );
