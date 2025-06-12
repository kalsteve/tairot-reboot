// gpt api인 OpenAI를 불러온다
/*
    참고
    node에서 기본적으로 사용하는 CommonJS 문법
    const { Configuration, OpenAI} = require('openai');
    ES6에서 사용하는 문법
    import {Configuration, OpenAI} from 'openai'
*/
const { Configuration, OpenAI,  } = require('openai');
const gptModel = ['gpt-3.5-turbo-1106', 'gpt-4.1-nano-2025-04-14'];
/**
 * gpt 대화 파라메터 설정 기본 설정만 현재 설정, 추후 수정 예정
 * model : gpt 모델
 * stream : 스트림 형태로 대화를 가져올건지 설정
 * message : 메시지
 * Openai.chat.completions.ChatCompletionCreateParamsBase에 더욱 자세한 설명있음
 */
const GPT_STREAM_CONFIG = {
  model: gptModel[1],
  stream: true,
  messages: null,
};

const gptConfig = {
  apiKey: null,
};

// openai의 객체를 담을 변수
let client = null;
// 스트리밍 정보를 받을 변수
let streamConfig = null;

// gpt 초기 설정을 위한 함수
function initializeGpt(gptApiKey) {
  // 초기화 두 번 되는 현상 방지.
  if (client) throw new Error('이미 gptApi가 초기화 되어있습니다.');

  gptConfig.apiKey = gptApiKey;

  client = new OpenAI(gptConfig);

  streamConfig = GPT_STREAM_CONFIG;
}

/**
 * 스트림이란?
 * 순치적으로 이루어진 데이터이며 대화가 이어지듯
 * 데이터를 주고 받는 형식입니다.
 * 데이터를 이렇게 보낸다면 순차적으로 보내기에 저장할 필요가 없습니다!
 * 당연히 저장 공간을 아낄 수 있겠죠!
 */
/**
 *  gpt에게 질문하고 스트림 형태로 데이터를 받는 형식
 * @param {message} message - 딕셔너리 형태의 메시지
 * @returns {stream} stream - 받을 스트림(gpt에게 실시간으로 데이터를 받는다.)
 */
async function getGptStream(message) {

  // 스트림을 이용하기 전
  if (!client) throw new Error('gptApi가 초기화 되지 않았습니다.');

  try {
    // 메시지를 넣는다.
    streamConfig.messages = [message];

    const stream = await client.chat.completions.create(streamConfig);

    // 스트림을 반환한다.
    return stream;
  } catch (err) {
    throw err;
  }
  return null;
}

async function getGptJsonStream(message) {
  let streamJsonConfig = streamConfig;
  // 스트림을 이용하기 전
  if (!client) throw new Error('gptApi가 초기화 되지 않았습니다.');

  try {
    streamJsonConfig['response_format'] = { "type": "json_object" };
    // 메시지를 넣는다.
    streamJsonConfig.messages = message;

    console.log('config', streamJsonConfig);

    const stream = await client.chat.completions.create(streamJsonConfig);

    // 스트림을 반환한다.
    return stream;
  } catch (err) {
    throw err;
  }
  return null;
}

/**
 * gpt 메시지 형태
 *
 * 주의
 * json의 형식으로 key: value의 형식을 지니지만 딕셔너리와 다른 점에 주의해야한다
 * key의 경우 json이 문자열 임으로 주의
 *
 * 메시지의 형태는 보통 메시지라는 리스트안에 딕셔너리가 있는 형태이다.
 *
 * {"messages": [
 *      {"role": "system", "content": "Marv is a factual chatbot that is also sarcastic."},
 *      {"role": "user", "content": "What's the capital of France?"},
 *      {"role": "assistant", "content": "Paris, as if everyone doesn't know that already."}
 *    ]
 * }
 */

/**
 * gpt에 보내는 대화 형식
 * system - 어떤 형식의 대화를 추구할 건지
 * user - 유저의 질문 사항
 * assistant - gpt의 대답 내용
 * @param {string} role - system, user, assistant가 있다
 * @param {string} content - 프롬프트를 보내면 된다.
 * @returns - 메시지라는 딕셔너리를 보내게됨
 */
function gptMessageForm(role, content) {
  const message = {
    role: role,
    content: content,
  };
  return message;
}

module.exports = {
  initializeGpt,
  getGptStream,
  gptMessageForm,
  getGptJsonStream,
};
