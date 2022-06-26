import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { List } from 'src/app/models/list/list';
import { TaskService } from 'src/app/services/task/task.service';

@Component({
  selector: 'app-new-list',
  templateUrl: './new-list.component.html',
  styleUrls: ['./new-list.component.scss']
})
export class NewListComponent implements OnInit {

  constructor(private taskService: TaskService, private route: Router) { }

  ngOnInit() {
  }

  createNewList(title: string) {
    this.taskService.createList(title).subscribe((list: List) => {
      this.route.navigate(['/lists', list._id]);
    });
  }

}
