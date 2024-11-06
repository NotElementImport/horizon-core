import { comp, ref, mut } from '../horizon/index'
import sectionWrapper from './sectionWrapper'

interface ITodo {
    title: string
    complete: boolean
}

export default comp((_, { use, section, input, dom, dyn, text }) => {
    use(sectionWrapper, {
        title: '6. Пример TODO лист: ',
        desc: 'Полный пример всего функционала'
    }, () => {
        // Script:
        const allTodos = ref<ITodo[]>([])
        const newTodo  = mut('')

        const addTodo = () => {
            // Protect:
            if(newTodo.isHadHTMLTags) {
                alert('Todo not must have HTML logic')
                return
            }

            // Protect:
            if(newTodo.isValid) {
                allTodos.unshift({ title: newTodo.value, complete: false })
                newTodo.value = ''
            }
        }

        const changeStatusTodo = (index) => {
            allTodos.commit(() => {
                allTodos.value[index].complete = !allTodos.value[index].complete
            })
        }

        const removeTodo = (index) => {
            if(confirm(`Хотите удалить задачу: "${allTodos.value[index].title}"?`)) {
                allTodos.splice(index as any, 1)
            }
        }

        // Islands:
        const todoList = () => {
            // Template:
            if(allTodos.isNotValid)
                text('Добавьте задачу')

            for (const index in allTodos.value) {
                const todo = allTodos.value[index]

                section({ class: () =>  ['todo', todo.complete ? 'complete' : ''].join(' ') })
                    .click(() => changeStatusTodo(index))
                    .rightClick(() => removeTodo(index))
                    .caption(todo.title)
            }
        }

        // Root Template:
        section({ name: 'todo control panel', class: 'todos__header' }, _ => {
            dom('button', { })
                .click(() => addTodo())
                .caption('Добавить')
                
            input(newTodo, { })
                .enterKey(() => addTodo())
        })

        dyn('section', { name: 'todo list', class: 'todos__content' }, ({ watch }) => {
            watch(allTodos)
            todoList()
        })
    })
})