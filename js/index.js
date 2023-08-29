// import { lyric, tlyric } from './haikuotianko.js';
// import { lyric, tlyric } from './wodezhanzheng.js';
import { lyric, tlyric } from './nanniadejing.js';

/**
 * 解析歌词时间
 * @param {String} timeStr 时间字符串
 * @returns
 */
function parseTime(timeStr) {
	const parse = timeStr.split(':');
	return +parse[0] * 60 + +parse[1];
}
/**
 * 查找需要翻译歌词
 * @param  {Number} time 原歌词时间
 * @param  {Array} tlyric 翻译歌词
 */
function findLyric(time, tlyric) {
	let result = '';
	tlyric.forEach((item) => {
		if (item.time === time) {
			result = item.content;
		}
	});
	return result;
}
/**
 * 解析歌词
 * 得到一个歌词数组
 * 每个歌词对象：
 * { time: 歌词时间, content: 歌词内容 }
 * @param  {String} lyric 歌词
 * @param  {Boolean} is_t 是否翻译歌词
 */
function parseLyric(lyric, is_t = false) {
	if (lyric === '') return [];
	const time_rule = /\[\d{2}:\d{2}.\d{1,3}]/g;
	let lrc = lyric.split('\n');
	let tlrc = [];
	// 如果需要翻译歌词就递归解析歌词
	if (is_t) tlrc = parseLyric(tlyric);
	const result = [];
	lrc.forEach((item) => {
		const time = item.match(time_rule);
		const content = item.replace(time_rule, '');
		if (time) {
			const parse_time = parseTime(time[0].substring(1, time[0].length - 1));
			result.push({
				time: parse_time,
				content: content.length !== 0 ? content.trim() : content,
				t_content: is_t ? findLyric(parse_time, tlrc) : ''
			});
		}
	});
	return result;
}

const lrc_data = parseLyric(lyric, true);
const doms = {
	audio: document.querySelector('#audio'),
	ul: document.querySelector('.lyric-list'),
	container: document.querySelector('.lyric-container')
};

/**
 * 找到当前音乐播放时间歌词下标
 * 如果为 -1 则是当前歌词数组第一个下标
 * 如果为 null 则是当前歌词数组最后一个下标
 */
function findIndex() {
	const current_time = doms.audio.currentTime;
	let index = null;
	for (let i = 0; i < lrc_data.length; i++) {
		if (lrc_data[i].time > current_time) {
			index = i - 1;
			break;
		}
	}
	return index < 0 ? 0 : index === null ? lrc_data.length - 1 : index;
}

/**
 * 创建歌词元素
 */
function createLrcElement() {
	// 文档片段
	const fragment = document.createDocumentFragment();
	lrc_data.forEach((item) => {
		const li_dom = document.createElement('li');
		// 是否有翻译歌词
		if (item.t_content) {
			li_dom.innerHTML = `${item.content}<br />${item.t_content}`;
		} else {
			li_dom.textContent = item.content;
		}
		fragment.appendChild(li_dom);
	});
	doms.ul.appendChild(fragment);
}
createLrcElement();

// 歌词容器高度
const container_height = doms.container.clientHeight;
// 因为翻译歌词的问题，需要拿 ul 高度来计算 li 每一行的平均高度，这样在滚动时不会产生滚动错乱的问题
const ul_height = doms.ul.clientHeight;
const li_height = ul_height / lrc_data.length;
// 最大偏移量
const max_offset = ul_height - container_height;
/**
 * 设置歌词ul偏移量
 */
function setUlOffset() {
	const index = findIndex();
	let offset = li_height * index + li_height / 2 - container_height / 2;
	if (offset < 0) {
		offset = 0;
	}
	if (offset > max_offset) {
		offset = max_offset;
	}
	doms.ul.style.transform = `translateY(${-offset}px)`;
	// 去除上一个高亮歌词类名
	const active_li = doms.ul.querySelector('.active');
	if (active_li) active_li.classList.remove('active');
	// 为当前高亮歌词添加类名
	doms.ul.children[index].classList.add('active');
}

// 为 audio 添加时间更改事件
doms.audio.addEventListener('timeupdate', setUlOffset);
