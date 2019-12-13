/**
 * Created by judy on 2019-12-13.
 */

// 버튼에 이벤트 연결
function bindLogoutButton() {
    const btnLogout = document.querySelector('#btn_logout');
    btnLogout.addEventListener('click', logout);
}

// 토큰 체크
function getToken() {
    return localStorage.getItem('token');
}

// 토큰으로 서버에서 나의 정보 받아오기
async function getUserByToken(token) {
    try {
        const res = await axios.get('./index.html', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
    } catch  (error) {
        console.log('getUserByToken', error);
        return null;
    }
}

// 나의 책을 서버에서 받아오기
async function getBooks(token) {
    try {
        const res = await axios.get('./index.html', {

            headers: {
                Authorization: `Bearer ${token}`
            },
        });
        return res.data;
    } catch(error) {
        console.log('getBooks error', error);
        return null;
    }
}

// 받아온 책을 그리기
function render(books) {

}

async function main() {
    // 버튼에 이벤트 연결
    bindLogoutButton();

    // 토큰 체크
    const token = getToken();
    if( token === null ) {
        location.assign('/login');
        return;
    }

    // 토큰으로 서버에서 나의 정보 받아오기
    const user = await getUserByToken(token);
    if( user === null ) {
        localStorage.clear();
        location.assign('/login');
        return;
    }

    // 나의 책을 서버에서 받아오기
    const books = await getBooks(token);
    if( books === null ) {
        return;
    }

    // 받아온 책을 그리기
    render(books);
}

document.addEventListener('DOMContentLoaded', main);