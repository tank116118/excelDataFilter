import { defineStore } from 'pinia'

interface UserState {
  name: string
  age: number
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    name: 'John Doe',
    age: 30
  }),
  getters: {
    doubleAge: (state) => state.age * 2
  },
  actions: {
    incrementAge() {
      this.age++
    }
  }
})