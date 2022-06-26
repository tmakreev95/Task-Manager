import { AuthService } from './../../services/auth/auth.service';
import { TaskService } from './../../services/task/task.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { List } from '../../models/list/list';
import { Task } from '../../models/task/task';


@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss']
})
export class TaskViewComponent implements OnInit {
  lists: List[];
  tasks: Task[];

  showAddTaskButton: boolean;
  topBarButtonStatus: boolean = false;
  selectedListId: string;


  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router, private authService: AuthService) { }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      if(params.listId) {
        this.selectedListId = params.listId;
        this.taskService.getListTasks(params.listId).subscribe((tasks: Task[]) => {
          this.tasks = tasks;
          this.showAddTaskButton = true;
        });
      } else {
        this.tasks = undefined;
      }
    });

    this.taskService.getLists().subscribe((lists: List[]) => {
      this.lists = lists;
    });
  }

  onDeleteListClick() {
    this.taskService.deleteList(this.selectedListId).subscribe((response: any) => {
      this.lists = this.lists.filter(({ _id }) => _id !== response._id);
    });

  }

  completeTask(task: Task) {
    this.taskService.completeTask(task).subscribe(() => {
      task.completed = !task.completed;
    });
  }

  deleteTask(task: Task) {
    this.taskService.deleteTask(task).subscribe((response: any) => {
      this.tasks = this.tasks.filter(({ _id }) => _id !== response._id);
    });
  }

  topBarButtonOnClickEvent(){
    this.topBarButtonStatus = !this.topBarButtonStatus;
  }

  onEditListClickEvent(listTitle: string, listId: string) {
    this.router.navigate(['/lists/edit-list/', listId, { listTitle: listTitle}]);
  }

  onEditTaskClickEvent(listId: string, taskId: string, title: string,) {
    this.router.navigate(['/lists', listId, 'edit-task', taskId, { taskTitle: title}]);
  }

  onSignOutClickEvent() {
    this.authService.signOut();
  }


}
