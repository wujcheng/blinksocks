'use strict';Object.defineProperty(exports,'__esModule',{value:true});var _net=require('net');var _net2=_interopRequireDefault(_net);var _ip=require('ip');var _ip2=_interopRequireDefault(_ip);var _utils=require('../utils');var _defs=require('./defs');function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}const ATYP_V4=1;const ATYP_V6=4;const ATYP_DOMAIN=3;function getHostType(host){if(_net2.default.isIPv4(host)){return ATYP_V4}if(_net2.default.isIPv6(host)){return ATYP_V6}return ATYP_DOMAIN}class SsBasePreset extends _defs.IPreset{constructor(...args){var _temp;return _temp=super(...args),this._isHandshakeDone=false,this._isBroadCasting=false,this._staging=Buffer.alloc(0),this._atyp=ATYP_V4,this._host=null,this._port=null,_temp}onNotified(action){if(__IS_CLIENT__&&action.type===_defs.SOCKET_CONNECT_TO_REMOTE){var _action$payload=action.payload;const host=_action$payload.host,port=_action$payload.port;const type=getHostType(host);this._atyp=type;this._port=(0,_utils.numberToBuffer)(port);this._host=type===ATYP_DOMAIN?Buffer.from(host):_ip2.default.toBuffer(host)}}clientOut({buffer}){if(!this._isHandshakeDone){this._isHandshakeDone=true;return Buffer.from([this._atyp,...(this._atyp===ATYP_DOMAIN?(0,_utils.numberToBuffer)(this._host.length,1):[]),...this._host,...this._port,...buffer])}else{return buffer}}serverIn({buffer,next,broadcast,fail}){if(!this._isHandshakeDone){if(this._isBroadCasting){this._staging=Buffer.concat([this._staging,buffer]);return}if(buffer.length<7){fail(`invalid length: ${buffer.length}`);return}const atyp=buffer[0];let addr;let port;let offset=3;switch(atyp){case ATYP_V4:addr=_ip2.default.toString(buffer.slice(1,5));port=buffer.slice(5,7).readUInt16BE(0);offset+=4;break;case ATYP_V6:if(buffer.length<19){fail(`invalid length: ${buffer.length}`);return}addr=_ip2.default.toString(buffer.slice(1,17));port=buffer.slice(17,19).readUInt16BE(0);offset+=16;break;case ATYP_DOMAIN:const domainLen=buffer[1];if(buffer.length<domainLen+4){fail(`invalid length: ${buffer.length}`);return}addr=buffer.slice(2,2+domainLen).toString();if(!(0,_utils.isValidHostname)(addr)){fail(`addr=${addr} is an invalid hostname`);return}port=buffer.slice(2+domainLen,4+domainLen).readUInt16BE(0);offset+=domainLen+1;break;default:fail(`invalid atyp: ${atyp}`);return;}const data=buffer.slice(offset);this._isBroadCasting=true;broadcast({type:_defs.SOCKET_CONNECT_TO_REMOTE,payload:{host:addr,port:port,onConnected:()=>{next(Buffer.concat([data,this._staging]));this._isHandshakeDone=true;this._isBroadCasting=false;this._staging=null}}})}else{return buffer}}}exports.default=SsBasePreset;