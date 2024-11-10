import { defineRepositoryFactory } from './core/repository.mjs'

class Person {
    public firstName = ''
    public lastName = ''
    public middleName = ''

    constructor(name: string) {
        const [ 
            lastName = '',
            firstName = '',
            middleName = '' 
        ] = name.trim().split(' ')
    
        this.firstName = firstName
        this.lastName = lastName
        this.middleName = middleName
    }

    toString() {
        return `${this.lastName} ${this.firstName} ${this.middleName}`
    }
}

const usePerson = defineRepositoryFactory(Person)