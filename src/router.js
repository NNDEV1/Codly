/* global CODLY_LANDING_URL */
import Vue from 'vue';
import VueRouter from 'vue-router';
import Cookies from 'js-cookie';

import store from './vuex';
import { webAuth } from './vuex/modules/auth';
import routes from './pages';

Vue.use(VueRouter);

const mainRouter = new VueRouter({
  mode: 'history',
  routes: routes.student,
});


// Set page title based on page metadata and check login on each navigation
mainRouter.beforeEach(async (to, from, next) => {
  // Set page title
  if (typeof to.meta.title === 'string') {
    document.title = to.meta.title;
  } else if (typeof to.meta.title === 'function') {
    const result = to.meta.title(to);
    if (result instanceof Promise) {
      const routeChecking = to.path;
      result.then((result2) => {
        if (mainRouter.currentRoute.path === routeChecking) document.title = result2;
      });
    } else document.title = result;
  } else if (to.meta.label) {
    document.title = `${to.meta.label} | Codly`;
  } else {
    document.title = 'Codly';
  }

  // For instructors, switch classroom context if necessary
  if (store.state.user.role === 'instructor') {
    const selectedCode = (store.getters['classroom/instructor/selectedClassroom'] || {}).code;
    if (to.params.classroomCode && to.params.classroomCode !== selectedCode) {
      store.commit('classroom/instructor/switchClassroom', to.params.classroomCode);
    }
  }

  // Parse login information if necessary
  if (window.location.hash.startsWith('#access_token')) {
    await new Promise((resolve) => {
      webAuth.parseHash({
        hash: window.location.hash,
        state: Cookies.get('state'),
        nonce: Cookies.get('nonce'),
      }, (err, res) => {
        if (res) store.dispatch('auth/loginCallback', res); // hash was found and parseable
        resolve();
      });
    });
  }

  // Reject unauthenticated users from protected routes
  if (to.meta.protected && !store.getters['auth/isAuthenticated']) {
    window.location.replace(`${CODLY_LANDING_URL}/login?backto=${encodeURIComponent(to.fullPath)}`);
  }

  next();
});

export default mainRouter;


export const routers = {
  student: new VueRouter({
    mode: 'history',
    routes: routes.student,
  }),

  instructor: new VueRouter({
    mode: 'history',
    routes: routes.instructor,
  }),
};
